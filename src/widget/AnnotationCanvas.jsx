import { useState, useRef, useEffect } from "react";
import { T } from "./i18n";
import { INK, PAPER, RED, LIGHT, BORDER, SLATE } from "./theme";
import { PenIcon, ArrIcon, BoxIcon, TextIcon, UndoIcon, ErasIcon } from "./icons";

// ─── ANNOTATION CANVAS ───────────────────────────────────────────────────────
export default function AnnotationCanvas({ screenshotData, onAnnotated, lang }) {
  const t = T[lang];
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const inputRef   = useRef(null);
  const [tool, setTool]       = useState("pen");
  const [color, setColor]     = useState(RED);
  const [strokes, setStrokes] = useState([]);
  const [textInput, setTextInput] = useState(null); // { x, y } — position only
  const textValue  = useRef("");  // current typed value — ref avoids stale closure
  const colorRef   = useRef(RED); // track color in ref too
  const drawing    = useRef(false);
  const startPos   = useRef(null);
  const livePts    = useRef([]);
  const committed  = useRef(false); // prevent double-commit from blur+enter
  const COLORS = [RED, "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6", INK];

  // Keep colorRef in sync
  useEffect(() => { colorRef.current = color; }, [color]);

  function redrawAll(extra, strokesOverride) {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (imgRef.current?.complete) ctx.drawImage(imgRef.current, 0, 0, cv.width, cv.height);
    (strokesOverride || strokes).forEach(s => drawOne(ctx, s));
    if (extra) drawOne(ctx, extra);
  }

  function drawOne(ctx, s) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.tool === "pen" ? 3 : 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (s.tool === "pen" && s.pts?.length > 1) {
      ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
      s.pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    } else if (s.tool === "rect" && s.end) {
      ctx.beginPath(); ctx.strokeRect(s.s.x, s.s.y, s.end.x - s.s.x, s.end.y - s.s.y);
    } else if (s.tool === "arrow" && s.end) {
      const dx = s.end.x - s.s.x, dy = s.end.y - s.s.y, angle = Math.atan2(dy, dx), len = Math.hypot(dx, dy);
      if (len < 5) return;
      ctx.beginPath(); ctx.moveTo(s.s.x, s.s.y); ctx.lineTo(s.end.x, s.end.y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s.end.x, s.end.y);
      ctx.lineTo(s.end.x - 16 * Math.cos(angle - 0.4), s.end.y - 16 * Math.sin(angle - 0.4));
      ctx.lineTo(s.end.x - 16 * Math.cos(angle + 0.4), s.end.y - 16 * Math.sin(angle + 0.4));
      ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
    } else if (s.tool === "text" && s.text) {
      ctx.fillStyle = s.color;
      ctx.font = "bold 18px 'DM Sans', sans-serif";
      ctx.fillText(s.text, s.s.x, s.s.y);
    }
  }

  useEffect(() => { redrawAll(); }, [strokes]);

  useEffect(() => {
    if (textInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
      textValue.current = "";
    }
  }, [textInput]);

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    const sx = canvasRef.current.width / r.width, sy = canvasRef.current.height / r.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX, cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * sx, y: (cy - r.top) * sy };
  }

  function commitText() {
    if (committed.current) return;
    const val = textValue.current.trim();
    if (!val) { setTextInput(null); textValue.current = ""; return; }
    committed.current = true;
    const pos = textInput; // capture current position
    const col = colorRef.current;
    const newStroke = { tool: "text", color: col, s: { x: pos.x, y: pos.y }, text: val };
    setStrokes(prev => {
      const next = [...prev, newStroke];
      requestAnimationFrame(() => {
        redrawAll(null, next);
        onAnnotated(canvasRef.current.toDataURL());
      });
      return next;
    });
    setTextInput(null);
    textValue.current = "";
    setTimeout(() => { committed.current = false; }, 100);
  }

  function onCanvasClick(e) {
    if (tool !== "text") return;
    if (textInput) {
      commitText();
      return;
    }
    const p = getPos(e);
    committed.current = false;
    setTextInput({ x: p.x, y: p.y });
  }

  function getCanvasScale() {
    const cv = canvasRef.current;
    if (!cv) return { scaleX: 1, scaleY: 1 };
    const r = cv.getBoundingClientRect();
    return { scaleX: r.width / cv.width, scaleY: r.height / cv.height };
  }

  function onDown(e) {
    if (tool === "text") return;
    e.preventDefault(); const p = getPos(e); drawing.current = true; startPos.current = p; livePts.current = [p];
  }
  function onMove(e) {
    if (tool === "text") return;
    e.preventDefault(); if (!drawing.current) return;
    const p = getPos(e);
    if (tool === "pen") { livePts.current = [...livePts.current, p]; redrawAll({ tool: "pen", color, pts: livePts.current }); }
    else redrawAll({ tool, color, s: startPos.current, end: p });
  }
  function onUp(e) {
    if (tool === "text") return;
    if (!drawing.current) return; drawing.current = false;
    const r = canvasRef.current.getBoundingClientRect();
    const raw = e.changedTouches ? e.changedTouches[0] : e;
    const p = { x: (raw.clientX - r.left) * canvasRef.current.width / r.width, y: (raw.clientY - r.top) * canvasRef.current.height / r.height };
    const stroke = tool === "pen" ? { tool: "pen", color, pts: livePts.current } : { tool, color, s: startPos.current, end: p };
    setStrokes(prev => [...prev, stroke]);
    setTimeout(() => onAnnotated(canvasRef.current.toDataURL()), 40);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: LIGHT, borderRadius: 8, border: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
        {[["pen", t.toolDraw, <PenIcon/>], ["arrow", t.toolArrow, <ArrIcon/>], ["rect", t.toolBox, <BoxIcon/>], ["text", lang === "en" ? "Text" : "Texto", <TextIcon/>]].map(([id, lbl, icon]) => (
          <button key={id} onClick={() => { if (textInput) commitText(); setTool(id); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 5, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, transition: "all 0.12s", background: tool === id ? INK : "transparent", color: tool === id ? PAPER : SLATE }}>
            {icon}{lbl}
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: BORDER, margin: "0 2px" }}/>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: color === c ? `2.5px solid ${INK}` : `2px solid ${PAPER}`, outline: color === c ? `1.5px solid ${INK}` : "none", cursor: "pointer", padding: 0, flexShrink: 0 }}/>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          <button onClick={() => { setStrokes(p => p.slice(0, -1)); setTextInput(null); textValue.current = ""; }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 5, border: `1px solid ${BORDER}`, cursor: "pointer", background: "#fff", color: SLATE, fontSize: 11, fontFamily: "'DM Sans',sans-serif" }}><UndoIcon/>{t.undo}</button>
          <button onClick={() => { setStrokes([]); setTextInput(null); textValue.current = ""; onAnnotated(null); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 5, border: `1px solid ${BORDER}`, cursor: "pointer", background: "#fff", color: SLATE, fontSize: 11, fontFamily: "'DM Sans',sans-serif" }}><ErasIcon/>{t.clear}</button>
        </div>
      </div>

      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1.5px solid ${BORDER}` }}>
        <img ref={imgRef} src={screenshotData} alt="" style={{ display: "none" }} onLoad={() => redrawAll()}/>
        <canvas ref={canvasRef} width={680} height={310}
          style={{ display: "block", width: "100%", touchAction: "none", cursor: tool === "text" ? "text" : "crosshair" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onClick={onCanvasClick}/>

        {textInput && (() => {
          const { scaleX, scaleY } = getCanvasScale();
          return (
            <input
              ref={inputRef}
              onChange={e => { textValue.current = e.target.value; }}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); commitText(); }
                if (e.key === "Escape") { setTextInput(null); textValue.current = ""; }
              }}
              onBlur={commitText}
              placeholder={lang === "en" ? "Type, then Enter..." : "Escribe, luego Enter..."}
              style={{
                position: "absolute",
                left: textInput.x * scaleX,
                top: Math.max(0, textInput.y * scaleY - 24),
                background: "rgba(255,255,255,0.95)",
                border: `2px solid ${color}`,
                borderRadius: 4, padding: "3px 7px",
                fontSize: 15, fontWeight: 700,
                color, fontFamily: "'DM Sans',sans-serif",
                outline: "none", minWidth: 100, maxWidth: 260,
                boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
              }}
            />
          );
        })()}

        {strokes.length === 0 && !textInput && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 5 }}>
            <div style={{ color: "#aaa", fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>{t.annotateHint}</div>
            <div style={{ color: "#ccc", fontSize: 11, fontFamily: "'DM Sans',sans-serif" }}>{t.annotateSubHint}</div>
          </div>
        )}
      </div>
    </div>
  );
}
