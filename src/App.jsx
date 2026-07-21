import { useState, useEffect } from "react";
import NotasWidget from "./widget/NotasWidget";
import LangToggle from "./widget/LangToggle";
import { NotasLogo } from "./widget/icons";
import { INK, PAPER, RED, GREEN, SLATE, BORDER, FONT_LINK } from "./widget/theme";

// ─── STANDALONE SESSION PAGE ───────────────────────────────────────────────
// This is the page a client lands on from a session link
// (notas-app-fawn.vercel.app?session=...). It's just a thin shell — the
// actual feedback-capture UI (trigger button, annotation, submit, report)
// all lives in NotasWidget, shared with embed mode so both stay in sync.
export default function App() {
  const [lang, setLang]           = useState("en");
  const [sessionId, setSessionId] = useState(null);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) setSessionId(sid);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", background: PAPER, display: "flex", flexDirection: "column" }}>
      <link href={FONT_LINK} rel="stylesheet"/>

      {/* ── HEADER ── */}
      <header style={{ background: INK, padding: "0 20px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", flexShrink: 0 }}>
        <NotasLogo size="md" inverted/>
        <LangToggle lang={lang} setLang={setLang} inverted/>
      </header>

      {/* ── LANDING CONTENT ── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
        {sessionId ? (
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: INK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="36" height="36" viewBox="0 0 18 18" fill="none">
                <path d="M3 14V4l5 6V4M13 4v10" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 13l4-3" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 700, color: INK, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              {lang === "en" ? "You're all set." : "Todo listo."}
            </h1>
            <p style={{ fontSize: 15, color: SLATE, lineHeight: 1.7, margin: "0 0 8px" }}>
              {lang === "en"
                ? "Go ahead and explore the app. Whenever you spot something — a bug, a thought, or an idea — tap the button in the corner to leave a nota."
                : "Explora la aplicación. Cuando encuentres algo — un error, un comentario o una idea — toca el botón en la esquina para dejar una nota."}
            </p>
            <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, margin: 0 }}>
              {lang === "en"
                ? "Your notas are saved automatically. When you're done testing, open your notas to review everything."
                : "Tus notas se guardan automáticamente. Cuando termines, ábrelas para revisar todo."}
            </p>
            {itemCount > 0 && (
              <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: GREEN + "15", border: `1px solid ${GREEN}30`, color: GREEN, fontSize: 13, fontWeight: 600 }}>
                ✓ {itemCount} {itemCount !== 1 ? (lang === "en" ? "notas this session" : "notas esta sesión") : (lang === "en" ? "nota this session" : "nota esta sesión")}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FEF2F0", border: "1.5px solid #FADBD8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>
              🔗
            </div>
            <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 700, color: INK, margin: "0 0 10px" }}>
              {lang === "en" ? "No session link found" : "No se encontró un enlace de sesión"}
            </h2>
            <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.7, margin: 0 }}>
              {lang === "en"
                ? "You need a session link from your developer to use Notas. Check your email or message thread for a link that looks like notas-app-fawn.vercel.app?session=..."
                : "Necesitas un enlace de sesión de tu desarrollador para usar Notas. Revisa tu correo o mensajes para encontrar un enlace que diga notas-app-fawn.vercel.app?session=..."}
            </p>
          </div>
        )}
      </main>

      {/* Widget itself — trigger button, annotate/describe flow, report
          modal — all handled by NotasWidget. key={lang} remounts it when
          the page-level language changes so it opens in sync; its own
          internal toggle still lets a tester switch languages mid-flow. */}
      {sessionId && (
        <NotasWidget
          key={lang}
          sessionId={sessionId}
          lang={lang}
          fontsIncluded
          onItemSaved={() => setItemCount(n => n + 1)}
        />
      )}
    </div>
  );
}
