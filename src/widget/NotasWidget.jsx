import { useState, useRef, useEffect } from "react";
import { T, harvestMeta } from "./i18n";
import { INK, PAPER, RED, GREEN, SLATE, LIGHT, BORDER, TYPE_CFG, FONT_LINK } from "./theme";
import { NotasLogo, BugIcon, ChatIcon, BulbIcon, XIcon, CheckIcon, Spinner } from "./icons";
import AnnotationCanvas from "./AnnotationCanvas";
import LangToggle from "./LangToggle";
import { captureScreenshot } from "./useScreenshot";
import { saveItem, uploadScreenshot, getSessionStatus } from "./supabaseClient";

const CORNER_STYLES = {
  "bottom-right": { bottom: 24, right: 24 },
  "bottom-left":  { bottom: 24, left: 24 },
};

/**
 * NotasWidget — embeddable feedback/bug-report widget.
 *
 * Drop this directly into any React/Next.js app:
 *
 *   import { NotasWidget } from "notas-widget";
 *   <NotasWidget sessionId="..." appName="Client Portal" />
 *
 * Requires a valid `sessionId` created via the Notas dashboard. Captures a
 * real screenshot of the host page with html2canvas, lets the tester
 * annotate it, and saves the nota straight to Supabase.
 *
 * Turning it off: closing (or archiving) the session from the dashboard
 * makes the widget stop rendering entirely on its next load — no redeploy
 * needed. It checks the session's status on mount and fails safe (hides
 * itself) for anything other than "active", but fails open (stays visible)
 * on a network error so a transient hiccup doesn't take feedback capture
 * down with it.
 *
 * Menu integration: by default the widget renders its own floating trigger
 * button. To surface it from your own app's menu instead (so a client can
 * open Notas on demand rather than seeing a floating button), pass
 * `renderTrigger={false}` and control it yourself with `open`/`onOpenChange`:
 *
 *   const [notasOpen, setNotasOpen] = useState(false);
 *   <button onClick={() => setNotasOpen(true)}>Leave feedback</button>
 *   <NotasWidget sessionId="..." renderTrigger={false} open={notasOpen} onOpenChange={setNotasOpen} />
 */
export default function NotasWidget({
  sessionId,
  appName,
  lang: initialLang = "en",
  position = "bottom-right",
  fontsIncluded = false,
  onItemSaved,
  renderTrigger = true,
  open: controlledOpen,
  onOpenChange,
}) {
  const [lang, setLang]             = useState(initialLang);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  function setOpen(v) {
    if (!isControlled) setUncontrolledOpen(v);
    onOpenChange?.(v);
  }
  const [step, setStep]             = useState("type");
  const [type, setType]             = useState(null);
  const [message, setMessage]       = useState("");
  const [repro, setRepro]           = useState("");
  const [severity, setSeverity]     = useState("medium");
  const [annotated, setAnnotated]   = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [capturing, setCapturing]   = useState(false);
  const [items, setItems]           = useState([]);
  const [report, setReport]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [sessionStatus, setSessionStatus] = useState("checking"); // "checking" | "active" | "inactive"
  const rootRef = useRef(null);
  const txtRef  = useRef(null);
  const t = T[lang];

  // Gate on the session's live status so closing it in the dashboard
  // actually disables the widget in deployed apps.
  useEffect(() => {
    if (!sessionId) { setSessionStatus("inactive"); return; }
    let cancelled = false;
    setSessionStatus("checking");
    getSessionStatus(sessionId)
      .then(status => { if (!cancelled) setSessionStatus(status === "active" ? "active" : "inactive"); })
      .catch(() => { if (!cancelled) setSessionStatus("active"); }); // fail open on network errors
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => { if (step === "describe" && txtRef.current) txtRef.current.focus(); }, [step]);

  // Runs the reset-and-capture sequence whenever the widget opens, whether
  // that's the internal trigger button or a host app's own menu item
  // flipping the controlled `open` prop to true.
  useEffect(() => {
    if (!open) return;
    setStep("type"); setType(null);
    setMessage(""); setRepro(""); setSeverity("medium"); setAnnotated(null);
    setScreenshot(null); setCapturing(true);
    let cancelled = false;
    captureScreenshot(rootRef.current).then(dataUrl => {
      if (cancelled) return;
      setScreenshot(dataUrl);
      setCapturing(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit() {
    if (!message.trim() || !sessionId) return;
    setSaving(true);
    const meta = harvestMeta();
    if (appName) meta.appName = appName;
    const imgData = annotated || screenshot;
    const local = { id: Date.now(), type, message: message.trim(), repro: repro.trim(), severity: type === "bug" ? severity : null, meta, screenshot: imgData, hasAnnotation: !!annotated };
    setItems(p => [...p, local]);
    setStep("success");
    try {
      const iid = `item_${Date.now()}`;
      let screenshotUrl = null;
      if (imgData) {
        try {
          screenshotUrl = await uploadScreenshot(sessionId, iid, imgData);
        } catch (uploadErr) {
          console.warn("Notas: screenshot upload failed —", uploadErr.message);
        }
      }
      const saved = await saveItem(sessionId, { ...local, screenshotUrl });
      onItemSaved?.(saved || local);
    } catch (err) {
      console.error("Notas: failed to save nota —", err.message);
    }
    setSaving(false);
    setTimeout(() => setOpen(false), 2200);
  }

  const bugs  = items.filter(i => i.type === "bug").length;
  const fbs   = items.filter(i => i.type === "feedback").length;
  const ideas = items.filter(i => i.type === "idea").length;
  const STEPS = ["type", "annotate", "describe"];
  const si = STEPS.indexOf(step);

  if (!sessionId) {
    console.warn("NotasWidget: no sessionId provided — widget will not render.");
    return null;
  }
  // Still checking the session's status, or it came back closed/archived/
  // missing — render nothing either way. (If you're controlling `open`
  // from your own menu item, that button should also be conditioned on
  // this eventually settling to "active" if you want it to disappear too;
  // this early return only covers NotasWidget's own UI.)
  if (sessionStatus !== "active") return null;

  return (
    <div ref={rootRef} style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {!fontsIncluded && <link href={FONT_LINK} rel="stylesheet"/>}

      {/* ── TRIGGER BUTTON ── */}
      {!open && renderTrigger && (
        <div style={{ position: "fixed", zIndex: 900, ...CORNER_STYLES[position] }}>
          <button onClick={() => setOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              background: INK, color: PAPER, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 6px 20px rgba(28,25,23,0.3)",
              position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: RED, borderRadius: "10px 0 0 10px" }}/>
            <span style={{ marginLeft: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <ChatIcon/>{t.trigger}
            </span>
          </button>
          {items.length > 0 && (
            <button onClick={() => setReport(true)}
              style={{ position: "absolute", top: -10, right: -10, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer", background: RED, color: "#fff", fontSize: 11, fontWeight: 700 }}>
              {items.length}
            </button>
          )}
        </div>
      )}

      {/* ── WIDGET ── */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 22 }}>
          <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,25,23,0.4)", backdropFilter: "blur(3px)" }}/>
          <div style={{ position: "relative", width: step === "annotate" ? 740 : 410, maxWidth: "95vw", maxHeight: "90vh", borderRadius: 14, overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 64px rgba(28,25,23,0.28)", animation: "notasSlideUp 0.26s cubic-bezier(0.34,1.4,0.64,1)", transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
            <style>{`@keyframes notasSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Widget header — flexShrink:0 so it can never get squeezed or
                scrolled out of view by a tall body (e.g. a large annotate
                canvas); the body below scrolls internally instead. */}
            <div style={{ background: INK, padding: "13px 15px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: step !== "type" && step !== "success" ? 10 : 0 }}>
                <div>
                  <NotasLogo size="sm" inverted/>
                  <div style={{ color: "#8C8279", fontSize: 10, marginTop: 4, fontFamily: "'DM Mono',monospace" }}>
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <LangToggle lang={lang} setLang={setLang} inverted/>
                  <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", color: "#8C8279", display: "flex", alignItems: "center", justifyContent: "center" }}><XIcon/></button>
                </div>
              </div>
              {step !== "type" && step !== "success" && (
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 8 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700,
                          background: i < si ? RED : i === si ? PAPER : "rgba(255,255,255,0.08)",
                          color: i < si ? "#fff" : i === si ? INK : "#4a4540" }}>
                          {i < si ? "✓" : i + 1}
                        </div>
                        <span style={{ fontSize: 10, color: i === si ? "#d4c9b8" : i < si ? RED : "#4a4540", fontWeight: i === si ? 500 : 400 }}>{t.stepLabels[i]}</span>
                      </div>
                      {i < STEPS.length - 1 && <div style={{ width: 14, height: 1, background: "rgba(255,255,255,0.08)" }}/>}
                    </div>
                  ))}
                </div>
              )}
              {(step === "success" || step === "type") && (
                <div style={{ color: PAPER, fontWeight: 600, fontSize: 13, marginTop: step === "type" ? 8 : 0, fontFamily: "'Fraunces',Georgia,serif" }}>{t.stepTitles[step]}</div>
              )}
            </div>

            {/* Widget body — scrolls internally, so the header/toolbar above
                is always reachable even if the content (e.g. a tall
                annotate canvas) exceeds the available height. */}
            <div style={{ background: "#fff", padding: step === "annotate" ? 13 : 16, overflowY: "auto", minHeight: 0 }}>

              {/* STEP 1: Type */}
              {step === "type" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(TYPE_CFG).map(([key, cfg]) => {
                    const tc = t.types[key];
                    return (
                      <button key={key} onClick={() => { setType(key); setStep("annotate"); }}
                        style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 9, border: `1.5px solid ${cfg.border}`, background: cfg.light, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left", transition: "all 0.14s" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                          {key === "bug" ? <BugIcon/> : key === "feedback" ? <ChatIcon/> : <BulbIcon/>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: INK }}>{tc.label}</div>
                          <div style={{ fontSize: 11, color: SLATE, marginTop: 1 }}>{tc.hint}</div>
                        </div>
                        <div style={{ marginLeft: "auto", color: "#ccc" }}>→</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: Annotate */}
              {step === "annotate" && (
                <div>
                  {capturing || !screenshot ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: SLATE, fontSize: 12 }}>
                      <Spinner/> {lang === "en" ? "Capturing screenshot..." : "Capturando pantalla..."}
                    </div>
                  ) : (
                    <AnnotationCanvas screenshotData={screenshot} onAnnotated={setAnnotated} lang={lang}/>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <button onClick={() => setStep("type")} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 12, padding: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{t.back}</button>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button onClick={() => setStep("describe")} style={{ padding: "6px 12px", borderRadius: 6, border: `1.5px solid ${BORDER}`, background: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: SLATE }}>{t.skip}</button>
                      <button onClick={() => setStep("describe")} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: INK, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: PAPER }}>
                        {annotated ? t.looksGood : t.continueWithout}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Describe */}
              {step === "describe" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <button onClick={() => setStep("annotate")} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 12, padding: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, textAlign: "left" }}>{t.backToMark}</button>

                  {(annotated || screenshot) && (
                    <div style={{ position: "relative", borderRadius: 7, overflow: "hidden", border: `1.5px solid ${BORDER}` }}>
                      <img src={annotated || screenshot} alt="" style={{ width: "100%", display: "block", maxHeight: 100, objectFit: "cover", objectPosition: "top" }}/>
                      {annotated && <div style={{ position: "absolute", top: 5, right: 5, background: RED, borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#fff", fontWeight: 600 }}>✏ {t.annotated}</div>}
                    </div>
                  )}

                  {type === "bug" && (
                    <div>
                      <div style={{ fontSize: 12, color: SLATE, marginBottom: 5, fontWeight: 500 }}>{t.severity.label}</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[["low", "#22C55E", t.severity.low], ["medium", "#F59E0B", t.severity.medium], ["high", RED, t.severity.high]].map(([s, c, lbl]) => (
                          <button key={s} onClick={() => setSeverity(s)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: `1.5px solid ${severity === s ? c : BORDER}`, background: severity === s ? c + "15" : "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: severity === s ? c : SLATE, transition: "all 0.14s" }}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 12, color: SLATE, marginBottom: 5, fontWeight: 500 }}>{t.descLabel[type]}</div>
                    <textarea ref={txtRef} value={message} onChange={e => setMessage(e.target.value)} placeholder={t.descPlaceholder[type]}
                      style={{ width: "100%", height: 76, padding: "9px 11px", borderRadius: 7, border: `1.5px solid ${BORDER}`, resize: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: INK, outline: "none", boxSizing: "border-box", lineHeight: 1.6, background: LIGHT }}/>
                  </div>

                  {type === "bug" && (
                    <div>
                      <div style={{ fontSize: 12, color: SLATE, marginBottom: 5, fontWeight: 500 }}>{t.reproLabel} <span style={{ color: "#bbb", fontWeight: 400 }}>— {t.reproOptional}</span></div>
                      <textarea value={repro} onChange={e => setRepro(e.target.value)} placeholder={t.reproPlaceholder}
                        style={{ width: "100%", height: 58, padding: "9px 11px", borderRadius: 7, border: `1.5px solid ${BORDER}`, resize: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: INK, outline: "none", boxSizing: "border-box", lineHeight: 1.6, background: LIGHT }}/>
                    </div>
                  )}

                  <div style={{ background: LIGHT, borderRadius: 7, padding: "7px 11px", border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>📎 {t.autoCapture}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px" }}>
                      {[["URL", window.location.pathname], ["Screenshot", annotated ? "✓ " + t.annotated : "✓"]].map(([k, v]) => (
                        <span key={k} style={{ fontSize: 11, color: SLATE }}><span style={{ color: "#bbb" }}>{k}: </span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: SLATE }}>{v}</span></span>
                      ))}
                    </div>
                  </div>

                  <button onClick={submit} disabled={!message.trim() || saving}
                    style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", cursor: message.trim() && !saving ? "pointer" : "not-allowed",
                      background: message.trim() && !saving ? INK : "#e8e0d6",
                      color: message.trim() && !saving ? PAPER : "#aaa", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, position: "relative", overflow: "hidden" }}>
                    {message.trim() && !saving && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: RED }}/>}
                    {saving ? <><Spinner/>{t.saving}</> : <span style={{ marginLeft: saving ? 0 : 6 }}>{t.submit}</span>}
                  </button>
                </div>
              )}

              {/* SUCCESS */}
              {step === "success" && (
                <div style={{ textAlign: "center", padding: "18px 0" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 11px", color: "#fff" }}><CheckIcon/></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 4, fontFamily: "'Fraunces',Georgia,serif" }}>{t.successTitle}</div>
                  <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.65 }}>{t.successBody}</div>
                  <div style={{ marginTop: 10, fontSize: 10, color: "#bbb", fontFamily: "'DM Mono',monospace" }}>{t.sessionItems(items.length)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {report && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div onClick={() => setReport(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,25,23,0.6)", backdropFilter: "blur(4px)" }}/>
          <div style={{ position: "relative", width: "100%", maxWidth: 660, maxHeight: "85vh", borderRadius: 14, overflow: "hidden", boxShadow: "0 32px 80px rgba(28,25,23,0.4)", display: "flex", flexDirection: "column" }}>
            <div style={{ background: INK, padding: "16px 20px", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <NotasLogo size="sm" inverted/>
                  <div style={{ color: "#8C8279", fontSize: 10, fontFamily: "'DM Mono',monospace", marginTop: 4 }}>{t.reportTitle}</div>
                  <div style={{ color: "#4a4540", fontSize: 9, fontFamily: "'DM Mono',monospace", marginTop: 2 }}>id: {sessionId}</div>
                </div>
                <button onClick={() => setReport(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", color: "#8C8279", display: "flex", alignItems: "center", justifyContent: "center" }}><XIcon/></button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[{ label: t.bugs, count: bugs, color: RED }, { label: t.feedback, count: fbs, color: "#3B82F6" }, { label: t.ideas, count: ideas, color: "#8B5CF6" }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 11px", border: `1px solid ${s.color}28` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',Georgia,serif" }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: "#8C8279", marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", flex: 1, overflowY: "auto", padding: 16 }}>
              {items.length === 0
                ? <div style={{ textAlign: "center", padding: 28, color: "#bbb", fontSize: 13 }}>{t.noItems}</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((item, i) => {
                      const cfg = TYPE_CFG[item.type];
                      return (
                        <div key={item.id} style={{ borderRadius: 9, border: `1.5px solid ${cfg.border}`, overflow: "hidden" }}>
                          <div style={{ background: cfg.light, padding: "8px 11px", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                              {item.type === "bug" ? <BugIcon/> : item.type === "feedback" ? <ChatIcon/> : <BulbIcon/>}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 12, color: cfg.color }}>{t.types[item.type].label}</span>
                            {item.severity && <span style={{ fontSize: 10, background: cfg.color + "18", color: cfg.color, padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>{t.severity[item.severity]}</span>}
                            {item.hasAnnotation && <span style={{ fontSize: 10, background: RED + "15", color: RED, padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>✏ {t.annotated}</span>}
                            <span style={{ marginLeft: "auto", fontSize: 10, color: "#ccc", fontFamily: "'DM Mono',monospace" }}>#{i + 1}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, padding: "9px 11px" }}>
                            {item.screenshot && <img src={item.screenshot} alt="" style={{ width: 88, height: 52, objectFit: "cover", objectPosition: "top", borderRadius: 5, border: `1px solid ${BORDER}`, flexShrink: 0 }}/>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: "0 0 4px", fontSize: 13, color: INK, lineHeight: 1.5 }}>{item.message}</p>
                              {item.repro && <p style={{ margin: "0 0 5px", fontSize: 11, color: SLATE, fontStyle: "italic", lineHeight: 1.4 }}>↳ {item.repro}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
