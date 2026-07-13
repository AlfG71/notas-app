import { useState, useRef, useEffect } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPABASE_URL     = "https://wutapcogyekvxrvynsxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGFwY29neWVrdnhydnluc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzE0MTYsImV4cCI6MjA5OTIwNzQxNn0.-UxP9w1nNfE3kIRUSX7eOa4PH4MNeq5CXb2Yy5eCX-c";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function uploadScreenshot(sessionId, itemId, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${sessionId}/${itemId}.png`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/screenshots/${path}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "image/png" },
    body: blob,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed ${res.status}: ${errText}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/screenshots/${path}`;
}

async function createSession(appName, clientName) {
  const data = await sbFetch("/feedback_sessions", { method: "POST", body: JSON.stringify({ app_name: appName, client_name: clientName, status: "active" }) });
  return data[0];
}

async function saveItem(sessionId, item) {
  const data = await sbFetch("/feedback_items", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, type: item.type, message: item.message, repro: item.repro || null, severity: item.severity || null, screenshot_url: item.screenshotUrl || null, has_annotation: item.hasAnnotation || false, meta: item.meta }),
  });
  return data[0];
}

// ─── i18n ────────────────────────────────────────────────────────────────────
const T = {
  en: {
    trigger: "Leave a Nota",
    stepTitles: { type: "What would you like to note?", annotate: "Mark it on screen", describe: "Tell us what happened", success: "Noted — keep going!" },
    stepLabels: ["Type", "Mark", "Describe"],
    types: {
      bug:      { label: "Something's broken",  hint: "A bug or error you found" },
      feedback: { label: "General thought",      hint: "A reaction or observation" },
      idea:     { label: "Idea or suggestion",   hint: "Something that could be better" },
    },
    severity: { label: "How much is this blocking you?", low: "I can work around it", medium: "It's slowing me down", high: "I can't continue" },
    descLabel: {
      bug:      "What happened — and what did you expect to happen instead?",
      feedback: "What caught your attention? What felt off, confusing, or unexpected?",
      idea:     "What would you change or add, and how would it help you?",
    },
    descPlaceholder: {
      bug:      "e.g. I clicked Save and nothing happened. I expected the record to update and a confirmation to appear...",
      feedback: "e.g. The layout on this page felt confusing — I wasn't sure where to look first...",
      idea:     "e.g. It would help to have a filter by date here so I don't have to scroll through everything...",
    },
    reproLabel: "Walk us through exactly what you were doing just before this happened.",
    reproOptional: "optional but very helpful",
    reproPlaceholder: "e.g. I opened the Reservations tab, searched for a name, clicked on the result, then tapped Edit...",
    autoCapture: "captured automatically",
    annotateHint: "Draw, arrow, box, or add text to mark the problem",
    annotateSubHint: "Select a tool above · optional but very helpful",
    skip: "Skip",
    looksGood: "Done →",
    continueWithout: "Continue →",
    backToMark: "← Back",
    back: "← Back",
    submit: "Save nota →",
    saving: "Saving...",
    successTitle: "Nota saved!",
    successBody: "Keep testing. All your notas will be bundled into a report at the end.",
    sessionItems: n => `${n} nota${n !== 1 ? "s" : ""} this session`,
    reportBtn: n => `My Notas${n > 0 ? ` (${n})` : ""}`,
    reportTitle: "Session Report",
    bugs: "Bugs", feedback: "Feedback", ideas: "Ideas",
    exportJson: "Export JSON", downloadPdf: "Download PDF",
    noItems: "No notas yet — submit some feedback to get started.",
    annotated: "marked",
    errors: n => `${n} console error${n !== 1 ? "s" : ""}`,
    toolDraw: "Pen", toolArrow: "Arrow", toolBox: "Box",
    undo: "Undo", clear: "Clear",
    connecting: "Connecting...", connected: "Session ready", offline: "No session — use a session link",
    severity_low: "I can work around it", severity_medium: "It's slowing me down", severity_high: "I can't continue",
  },
  es: {
    trigger: "Dejar una Nota",
    stepTitles: { type: "¿Qué quieres anotar?", annotate: "Márcalo en pantalla", describe: "Cuéntanos qué pasó", success: "¡Anotado — sigue!" },
    stepLabels: ["Tipo", "Marcar", "Describir"],
    types: {
      bug:      { label: "Algo está roto",       hint: "Un error que encontraste" },
      feedback: { label: "Comentario general",   hint: "Una reacción u observación" },
      idea:     { label: "Idea o sugerencia",    hint: "Algo que podría mejorar" },
    },
    severity: { label: "¿Cuánto te está bloqueando esto?", low: "Puedo continuar con dificultad", medium: "Me está frenando", high: "No puedo continuar" },
    descLabel: {
      bug:      "¿Qué pasó — y qué esperabas que pasara en su lugar?",
      feedback: "¿Qué llamó tu atención? ¿Qué se sintió confuso o inesperado?",
      idea:     "¿Qué cambiarías o agregarías, y cómo te ayudaría?",
    },
    descPlaceholder: {
      bug:      "Ej: hice clic en Guardar y no pasó nada. Esperaba que el registro se actualizara...",
      feedback: "Ej: el diseño de esta página se sintió confuso — no sabía dónde mirar primero...",
      idea:     "Ej: ayudaría tener un filtro por fecha aquí para no tener que desplazarme por todo...",
    },
    reproLabel: "Cuéntanos exactamente qué estabas haciendo justo antes de que esto ocurriera.",
    reproOptional: "opcional pero muy útil",
    reproPlaceholder: "Ej: abrí la pestaña de Reservaciones, busqué un nombre, hice clic en el resultado, luego toqué Editar...",
    autoCapture: "capturado automáticamente",
    annotateHint: "Dibuja, flechas, recuadros o agrega texto para marcar el problema",
    annotateSubHint: "Selecciona una herramienta arriba · opcional pero muy útil",
    skip: "Omitir",
    looksGood: "Listo →",
    continueWithout: "Continuar →",
    backToMark: "← Atrás",
    back: "← Atrás",
    submit: "Guardar nota →",
    saving: "Guardando...",
    successTitle: "¡Nota guardada!",
    successBody: "Sigue probando. Todas tus notas se agruparán en un informe al finalizar.",
    sessionItems: n => `${n} nota${n !== 1 ? "s" : ""} esta sesión`,
    reportBtn: n => `Mis Notas${n > 0 ? ` (${n})` : ""}`,
    reportTitle: "Informe de Sesión",
    bugs: "Errores", feedback: "Comentarios", ideas: "Ideas",
    exportJson: "Exportar JSON", downloadPdf: "Descargar PDF",
    noItems: "Sin notas aún — envía comentarios para empezar.",
    annotated: "marcado",
    errors: n => `${n} error${n !== 1 ? "es" : ""} de consola`,
    toolDraw: "Pluma", toolArrow: "Flecha", toolBox: "Recuadro",
    undo: "Deshacer", clear: "Limpiar",
    connecting: "Conectando...", connected: "Sesión lista", offline: "Sin sesión — usa un enlace de sesión",
    severity_low: "Puedo continuar con dificultad", severity_medium: "Me está frenando", severity_high: "No puedo continuar",
  },
};

function harvestMeta() {
  // Detect real browser from user agent
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Edg/"))         browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("OPR/"))    browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Firefox/")) browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Chrome/")) browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] || ""}`;

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Mac OS X"))  os = `macOS ${ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g,".") || ""}`;
  else if (ua.includes("Win"))  os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";

  return {
    page: document.title || window.location.pathname,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    browser,
    os,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    consoleErrors: [],
    networkErrors: [],
  };
}

// ─── COLOURS & TOKENS ─────────────────────────────────────────────────────────
const INK     = "#1C1917";
const PAPER   = "#F5F0E8";
const RED     = "#E8562A";   // the "red pen" accent
const GREEN   = "#2D6A4F";
const SLATE   = "#64748b";
const LIGHT   = "#FFF8F0";
const BORDER  = "#E2D9CC";

const TYPE_CFG = {
  bug:      { color:"#C0392B", light:"#FEF2F0", border:"#FADBD8" },
  feedback: { color:"#1A5276", light:"#EBF5FB", border:"#D6EAF8" },
  idea:     { color:"#5B2C6F", light:"#F5EEF8", border:"#E8DAEF" },
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Svg = ({ children, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const BugIcon   = () => <Svg><path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 8c-3.3 0-6 2.7-6 6v2c0 3.3 2.7 6 6 6s6-2.7 6-6v-2c0-3.3-2.7-6-6-6z"/><path d="M6 13H2M22 13h-4M6 17l-3 2M18 17l3 2M6 9l-3-2M18 9l3-2"/></Svg>;
const ChatIcon  = () => <Svg><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const BulbIcon  = () => <Svg><path d="M9 21h6M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/></Svg>;
const PenIcon   = () => <Svg s={15}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>;
const ArrIcon   = () => <Svg s={15}><path d="M5 12h14M12 5l7 7-7 7"/></Svg>;
const BoxIcon   = () => <Svg s={15}><path d="M3 3h18v18H3z"/></Svg>;
const ErasIcon  = () => <Svg s={15}><path d="M20 20H7L3 16l13-13 7 7-3 3M6 17l3-3"/></Svg>;
const UndoIcon  = () => <Svg s={15}><path d="M3 7v6h6M3 13C5 8 9.5 5 15 5a9 9 0 0 1 9 9"/></Svg>;
const XIcon     = () => <Svg s={14}><path d="M18 6L6 18M6 6l12 12"/></Svg>;
const CheckIcon = () => <Svg><path d="M20 6L9 17l-5-5"/></Svg>;
const ReportIc  = () => <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></Svg>;
const Spinner   = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
    </path>
  </svg>
);

// ─── NOTAS WORDMARK ───────────────────────────────────────────────────────────
function NotasLogo({ size = "md", inverted = false }) {
  const color = inverted ? PAPER : INK;
  const accent = RED;
  const sizes = { sm: { box:22, font:11, dot:4 }, md: { box:28, font:14, dot:5 }, lg: { box:36, font:18, dot:6 } };
  const s = sizes[size];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      {/* Mark: stylised N with red-pen stroke */}
      <div style={{ width:s.box, height:s.box, borderRadius:7, background: inverted ? "rgba(255,255,255,0.12)" : PAPER, border:`1.5px solid ${inverted?"rgba(255,255,255,0.2)":BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 }}>
        <svg width={s.box*0.6} height={s.box*0.6} viewBox="0 0 18 18" fill="none">
          <path d="M3 14V4l5 6V4M13 4v10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13l4-3" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:s.font, fontWeight:700, color, letterSpacing:"-0.02em" }}>notas</span>
    </div>
  );
}

// ─── LANG TOGGLE ─────────────────────────────────────────────────────────────
function LangToggle({ lang, setLang, inverted }) {
  return (
    <button onClick={() => setLang(l => l==="en"?"es":"en")}
      style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20, border:`1.5px solid ${inverted?"rgba(255,255,255,0.18)":BORDER}`, background: inverted?"rgba(255,255,255,0.07)":PAPER, cursor:"pointer", color: inverted?"#d4c9b8":SLATE, fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s" }}>
      <span style={{ fontSize:12 }}>{lang==="en"?"🇺🇸":"🇲🇽"}</span>
      {lang==="en" ? "EN" : "ES"}
      <span style={{ fontSize:9, opacity:0.6 }}>⇄</span>
    </button>
  );
}

// ─── ANNOTATION CANVAS ───────────────────────────────────────────────────────
function AnnotationCanvas({ screenshotData, onAnnotated, lang }) {
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
    ctx.clearRect(0,0,cv.width,cv.height);
    if (imgRef.current?.complete) ctx.drawImage(imgRef.current,0,0,cv.width,cv.height);
    (strokesOverride || strokes).forEach(s => drawOne(ctx,s));
    if (extra) drawOne(ctx,extra);
  }

  function drawOne(ctx, s) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.tool==="pen"?3:2.5; ctx.lineCap="round"; ctx.lineJoin="round";
    if (s.tool==="pen" && s.pts?.length>1) {
      ctx.beginPath(); ctx.moveTo(s.pts[0].x,s.pts[0].y);
      s.pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
    } else if (s.tool==="rect" && s.end) {
      ctx.beginPath(); ctx.strokeRect(s.s.x,s.s.y,s.end.x-s.s.x,s.end.y-s.s.y);
    } else if (s.tool==="arrow" && s.end) {
      const dx=s.end.x-s.s.x, dy=s.end.y-s.s.y, angle=Math.atan2(dy,dx), len=Math.hypot(dx,dy);
      if (len<5) return;
      ctx.beginPath(); ctx.moveTo(s.s.x,s.s.y); ctx.lineTo(s.end.x,s.end.y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s.end.x,s.end.y);
      ctx.lineTo(s.end.x-16*Math.cos(angle-0.4),s.end.y-16*Math.sin(angle-0.4));
      ctx.lineTo(s.end.x-16*Math.cos(angle+0.4),s.end.y-16*Math.sin(angle+0.4));
      ctx.closePath(); ctx.fillStyle=s.color; ctx.fill();
    } else if (s.tool==="text" && s.text) {
      ctx.fillStyle = s.color;
      ctx.font = "bold 18px 'DM Sans', sans-serif";
      ctx.fillText(s.text, s.s.x, s.s.y);
    }
  }

  useEffect(()=>{ redrawAll(); },[strokes]);

  useEffect(()=>{
    if (textInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
      textValue.current = "";
    }
  },[textInput]);

  function getPos(e) {
    const r=canvasRef.current.getBoundingClientRect();
    const sx=canvasRef.current.width/r.width, sy=canvasRef.current.height/r.height;
    const cx=e.touches?e.touches[0].clientX:e.clientX, cy=e.touches?e.touches[0].clientY:e.clientY;
    return { x:(cx-r.left)*sx, y:(cy-r.top)*sy };
  }

  function commitText() {
    if (committed.current) return;
    const val = textValue.current.trim();
    if (!val) { setTextInput(null); textValue.current = ""; return; }
    committed.current = true;
    const pos = textInput; // capture current position
    const col = colorRef.current;
    const newStroke = { tool:"text", color:col, s:{ x:pos.x, y:pos.y }, text:val };
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
    if (!cv) return { scaleX:1, scaleY:1 };
    const r = cv.getBoundingClientRect();
    return { scaleX: r.width / cv.width, scaleY: r.height / cv.height };
  }

  function onDown(e) {
    if (tool === "text") return;
    e.preventDefault(); const p=getPos(e); drawing.current=true; startPos.current=p; livePts.current=[p];
  }
  function onMove(e) {
    if (tool === "text") return;
    e.preventDefault(); if (!drawing.current) return;
    const p=getPos(e);
    if (tool==="pen") { livePts.current=[...livePts.current,p]; redrawAll({tool:"pen",color,pts:livePts.current}); }
    else redrawAll({tool,color,s:startPos.current,end:p});
  }
  function onUp(e) {
    if (tool === "text") return;
    if (!drawing.current) return; drawing.current=false;
    const r=canvasRef.current.getBoundingClientRect();
    const raw=e.changedTouches?e.changedTouches[0]:e;
    const p={ x: (raw.clientX - r.left) * canvasRef.current.width / r.width, y: (raw.clientY - r.top) * canvasRef.current.height / r.height };
    const stroke=tool==="pen"?{tool:"pen",color,pts:livePts.current}:{tool,color,s:startPos.current,end:p};
    setStrokes(prev=>[...prev,stroke]);
    setTimeout(()=>onAnnotated(canvasRef.current.toDataURL()),40);
  }

  const TextIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:LIGHT, borderRadius:8, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
        {[["pen",t.toolDraw,<PenIcon/>],["arrow",t.toolArrow,<ArrIcon/>],["rect",t.toolBox,<BoxIcon/>],["text",lang==="en"?"Text":"Texto",<TextIcon/>]].map(([id,lbl,icon])=>(
          <button key={id} onClick={()=>{ if(textInput) commitText(); setTool(id); }}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:5, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, transition:"all 0.12s", background:tool===id?INK:"transparent", color:tool===id?PAPER:SLATE }}>
            {icon}{lbl}
          </button>
        ))}
        <div style={{ width:1, height:16, background:BORDER, margin:"0 2px" }}/>
        {COLORS.map(c=>(
          <button key={c} onClick={()=>setColor(c)} style={{ width:16, height:16, borderRadius:"50%", background:c, border:color===c?`2.5px solid ${INK}`:`2px solid ${PAPER}`, outline:color===c?`1.5px solid ${INK}`:"none", cursor:"pointer", padding:0, flexShrink:0 }}/>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          <button onClick={()=>{ setStrokes(p=>p.slice(0,-1)); setTextInput(null); textValue.current=""; }} style={{ display:"flex", alignItems:"center", gap:3, padding:"4px 8px", borderRadius:5, border:`1px solid ${BORDER}`, cursor:"pointer", background:"#fff", color:SLATE, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}><UndoIcon/>{t.undo}</button>
          <button onClick={()=>{ setStrokes([]); setTextInput(null); textValue.current=""; onAnnotated(null); }} style={{ display:"flex", alignItems:"center", gap:3, padding:"4px 8px", borderRadius:5, border:`1px solid ${BORDER}`, cursor:"pointer", background:"#fff", color:SLATE, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}><ErasIcon/>{t.clear}</button>
        </div>
      </div>

      <div style={{ position:"relative", borderRadius:8, overflow:"hidden", border:`1.5px solid ${BORDER}` }}>
        <img ref={imgRef} src={screenshotData} alt="" style={{ display:"none" }} onLoad={()=>redrawAll()}/>
        <canvas ref={canvasRef} width={680} height={310}
          style={{ display:"block", width:"100%", touchAction:"none", cursor: tool==="text" ? "text" : "crosshair" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onClick={onCanvasClick}/>

        {textInput && (()=>{
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
              placeholder={lang==="en" ? "Type, then Enter..." : "Escribe, luego Enter..."}
              style={{
                position:"absolute",
                left: textInput.x * scaleX,
                top: Math.max(0, textInput.y * scaleY - 24),
                background:"rgba(255,255,255,0.95)",
                border:`2px solid ${color}`,
                borderRadius:4, padding:"3px 7px",
                fontSize:15, fontWeight:700,
                color, fontFamily:"'DM Sans',sans-serif",
                outline:"none", minWidth:100, maxWidth:260,
                boxShadow:"0 2px 10px rgba(0,0,0,0.18)",
              }}
            />
          );
        })()}

        {strokes.length===0&&!textInput&&(
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none", gap:5 }}>
            <div style={{ color:"#aaa", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>{t.annotateHint}</div>
            <div style={{ color:"#ccc", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{t.annotateSubHint}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]           = useState("en");
  const [open, setOpen]           = useState(false);
  const [step, setStep]           = useState("type");
  const [type, setType]           = useState(null);
  const [message, setMessage]     = useState("");
  const [repro, setRepro]         = useState("");
  const [severity, setSeverity]   = useState("medium");
  const [annotated, setAnnotated] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [items, setItems]         = useState([]);
  const [report, setReport]       = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const txtRef = useRef(null);
  const t = T[lang];

  useEffect(()=>{
    (async()=>{
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("session");
      if (sid) {
        setSessionId(sid);
      }
    })();
  },[]);

  useEffect(()=>{ if(step==="describe"&&txtRef.current) txtRef.current.focus(); },[step]);

  function openWidget() {
    setOpen(true); setStep("type"); setType(null);
    setMessage(""); setRepro(""); setSeverity("medium"); setAnnotated(null);
    // Generate a simple screenshot of the current page
    const cv = document.createElement("canvas");
    cv.width = 680; cv.height = 310;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = PAPER; ctx.fillRect(0,0,680,310);
    ctx.fillStyle = INK; ctx.fillRect(0,0,680,44);
    ctx.fillStyle = PAPER; ctx.font = "500 12px system-ui";
    ctx.fillText(`notas · ${window.location.href}`, 16, 26);
    ctx.fillStyle = "#fff"; ctx.roundRect(18,58,644,228,10); ctx.fill();
    ctx.strokeStyle = BORDER; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#aaa"; ctx.font = "11px system-ui";
    ctx.fillText(lang==="en" ? "Use the tools above to mark what you want to report" : "Usa las herramientas de arriba para marcar lo que quieres reportar", 32, 180);
    setScreenshot(cv.toDataURL("image/png"));
  }

  async function submit() {
    if(!message.trim()) return;
    setSaving(true);
    const meta=harvestMeta();
    const imgData = annotated || screenshot;
    const local={ id:Date.now(), type, message:message.trim(), repro:repro.trim(), severity:type==="bug"?severity:null, meta, screenshot:imgData, hasAnnotation:!!annotated };
    setItems(p=>[...p,local]);
    setStep("success");
    if(sessionId){
      try {
        const iid=`item_${Date.now()}`;
        let screenshotUrl=null;
        if(imgData){
          try{
            screenshotUrl=await uploadScreenshot(sessionId,iid,imgData);
          }catch(uploadErr){
            console.warn("Screenshot upload failed:",uploadErr.message);
          }
        }
        await saveItem(sessionId,{...local,screenshotUrl});
      } catch(err){
        console.error("Failed to save nota:",err.message);
      }
    }
    setSaving(false);
    setTimeout(()=>setOpen(false),2200);
  }

  const bugs=items.filter(i=>i.type==="bug").length;
  const fbs=items.filter(i=>i.type==="feedback").length;
  const ideas=items.filter(i=>i.type==="idea").length;
  const STEPS=["type","annotate","describe"];
  const si=STEPS.indexOf(step);

  // ── Status pill ──
  const statusColors={ info:{bg:"#EFF6FF",c:"#1D4ED8"}, ok:{bg:"#F0FDF4",c:"#15803D"}, warn:{bg:"#FFFBEB",c:"#92400E"} };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:PAPER, display:"flex", flexDirection:"column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ── HEADER ── */}
      <header style={{ background:INK, padding:"0 20px", height:50, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 12px rgba(0,0,0,0.3)", flexShrink:0 }}>
        <NotasLogo size="md" inverted/>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <LangToggle lang={lang} setLang={setLang} inverted/>
          {items.length > 0 && (
            <button onClick={()=>setReport(true)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
                background:RED, color:"#fff", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              <ReportIc/>{t.reportBtn(items.length)}
            </button>
          )}
        </div>
      </header>

      {/* ── LANDING CONTENT ── */}
      <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:28 }}>
        {sessionId ? (
          /* Has a valid session — ready to test */
          <div style={{ textAlign:"center", maxWidth:480 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:INK, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
              <svg width="36" height="36" viewBox="0 0 18 18" fill="none">
                <path d="M3 14V4l5 6V4M13 4v10" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 13l4-3" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:28, fontWeight:700, color:INK, margin:"0 0 12px", letterSpacing:"-0.02em" }}>
              {lang==="en" ? "You're all set." : "Todo listo."}
            </h1>
            <p style={{ fontSize:15, color:SLATE, lineHeight:1.7, margin:"0 0 8px" }}>
              {lang==="en"
                ? "Go ahead and explore the app. Whenever you spot something — a bug, a thought, or an idea — tap the button in the corner to leave a nota."
                : "Explora la aplicación. Cuando encuentres algo — un error, un comentario o una idea — toca el botón en la esquina para dejar una nota."}
            </p>
            <p style={{ fontSize:13, color:"#aaa", lineHeight:1.6, margin:0 }}>
              {lang==="en"
                ? "Your notas are saved automatically. When you're done testing, open your notas to review everything."
                : "Tus notas se guardan automáticamente. Cuando termines, ábrelas para revisar todo."}
            </p>
            {items.length > 0 && (
              <div style={{ marginTop:20, display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:GREEN+"15", border:`1px solid ${GREEN}30`, color:GREEN, fontSize:13, fontWeight:600 }}>
                ✓ {t.sessionItems(items.length)}
              </div>
            )}
          </div>
        ) : (
          /* No session param — show helpful error */
          <div style={{ textAlign:"center", maxWidth:420 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:"#FEF2F0", border:`1.5px solid #FADBD8`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:24 }}>
              🔗
            </div>
            <h2 style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:22, fontWeight:700, color:INK, margin:"0 0 10px" }}>
              {lang==="en" ? "No session link found" : "No se encontró un enlace de sesión"}
            </h2>
            <p style={{ fontSize:14, color:SLATE, lineHeight:1.7, margin:0 }}>
              {lang==="en"
                ? "You need a session link from your developer to use Notas. Check your email or message thread for a link that looks like notas-app-fawn.vercel.app?session=..."
                : "Necesitas un enlace de sesión de tu desarrollador para usar Notas. Revisa tu correo o mensajes para encontrar un enlace que diga notas-app-fawn.vercel.app?session=..."}
            </p>
          </div>
        )}
      </main>

      {/* ── TRIGGER BUTTON ── */}
      {!open && sessionId && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:900 }}>
          <button onClick={openWidget}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, border:"none", cursor:"pointer",
              background:INK, color:PAPER, fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
              boxShadow:"0 6px 20px rgba(28,25,23,0.3)",
              position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:RED, borderRadius:"10px 0 0 10px" }}/>
            <span style={{ marginLeft:6, display:"flex", alignItems:"center", gap:7 }}>
              <ChatIcon/>{t.trigger}
            </span>
          </button>
        </div>
      )}

      {/* ── WIDGET ── */}
      {open&&(
        <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:22 }}>
          <div onClick={()=>setOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.4)", backdropFilter:"blur(3px)" }}/>
          <div style={{ position:"relative", width:step==="annotate"?740:410, maxWidth:"95vw", borderRadius:14, overflow:"hidden",
            boxShadow:"0 24px 64px rgba(28,25,23,0.28)", animation:"slideUp 0.26s cubic-bezier(0.34,1.4,0.64,1)", transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
            <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Widget header */}
            <div style={{ background:INK, padding:"13px 15px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:step!=="type"&&step!=="success"?10:0 }}>
                <div>
                  <NotasLogo size="sm" inverted/>
                  <div style={{ color:"#8C8279", fontSize:10, marginTop:4, fontFamily:"'DM Mono',monospace" }}>
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <LangToggle lang={lang} setLang={setLang} inverted/>
                  <button onClick={()=>setOpen(false)} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:5, width:26, height:26, cursor:"pointer", color:"#8C8279", display:"flex", alignItems:"center", justifyContent:"center" }}><XIcon/></button>
                </div>
              </div>
              {/* Step progress */}
              {step!=="type"&&step!=="success"&&(
                <div style={{ display:"flex", gap:4, alignItems:"center", marginTop:8 }}>
                  {STEPS.map((s,i)=>(
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <div style={{ width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700,
                          background:i<si?RED:i===si?PAPER:"rgba(255,255,255,0.08)",
                          color:i<si?"#fff":i===si?INK:"#4a4540" }}>
                          {i<si?"✓":i+1}
                        </div>
                        <span style={{ fontSize:10, color:i===si?"#d4c9b8":i<si?RED:"#4a4540", fontWeight:i===si?500:400 }}>{t.stepLabels[i]}</span>
                      </div>
                      {i<STEPS.length-1&&<div style={{ width:14, height:1, background:"rgba(255,255,255,0.08)" }}/>}
                    </div>
                  ))}
                </div>
              )}
              {/* Step title */}
              {(step==="success"||step==="type")&&(
                <div style={{ color:PAPER, fontWeight:600, fontSize:13, marginTop:step==="type"?8:0, fontFamily:"'Fraunces',Georgia,serif" }}>{t.stepTitles[step]}</div>
              )}
            </div>

            {/* Widget body */}
            <div style={{ background:"#fff", padding:step==="annotate"?13:16 }}>

              {/* STEP 1: Type */}
              {step==="type"&&(
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {Object.entries(TYPE_CFG).map(([key,cfg])=>{
                    const tc=t.types[key];
                    return (
                      <button key={key} onClick={()=>{ setType(key); setStep("annotate"); }}
                        style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 13px", borderRadius:9, border:`1.5px solid ${cfg.border}`, background:cfg.light, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textAlign:"left", transition:"all 0.14s" }}
                        onMouseEnter={e=>{e.currentTarget.style.transform="translateX(3px)";e.currentTarget.style.borderColor=cfg.color;}}
                        onMouseLeave={e=>{e.currentTarget.style.transform="translateX(0)";e.currentTarget.style.borderColor=cfg.border;}}>
                        <div style={{ width:30,height:30,borderRadius:8,background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0 }}>
                          {key==="bug"?<BugIcon/>:key==="feedback"?<ChatIcon/>:<BulbIcon/>}
                        </div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:13,color:INK }}>{tc.label}</div>
                          <div style={{ fontSize:11,color:SLATE,marginTop:1 }}>{tc.hint}</div>
                        </div>
                        <div style={{ marginLeft:"auto",color:"#ccc" }}>→</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: Annotate */}
              {step==="annotate"&&screenshot&&(
                <div>
                  <AnnotationCanvas screenshotData={screenshot} onAnnotated={setAnnotated} lang={lang}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                    <button onClick={()=>setStep("type")} style={{ background:"none", border:"none", cursor:"pointer", color:RED, fontSize:12, padding:0, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{t.back}</button>
                    <div style={{ display:"flex", gap:7 }}>
                      <button onClick={()=>setStep("describe")} style={{ padding:"6px 12px", borderRadius:6, border:`1.5px solid ${BORDER}`, background:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:SLATE }}>{t.skip}</button>
                      <button onClick={()=>setStep("describe")} style={{ padding:"6px 12px", borderRadius:6, border:"none", background:INK, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:PAPER }}>
                        {annotated?t.looksGood:t.continueWithout}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Describe */}
              {step==="describe"&&(
                <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                  <button onClick={()=>setStep("annotate")} style={{ background:"none", border:"none", cursor:"pointer", color:RED, fontSize:12, padding:0, fontFamily:"'DM Sans',sans-serif", fontWeight:500, textAlign:"left" }}>{t.backToMark}</button>

                  {/* Screenshot thumb */}
                  {(annotated||screenshot)&&(
                    <div style={{ position:"relative", borderRadius:7, overflow:"hidden", border:`1.5px solid ${BORDER}` }}>
                      <img src={annotated||screenshot} alt="" style={{ width:"100%", display:"block", maxHeight:100, objectFit:"cover", objectPosition:"top" }}/>
                      {annotated&&<div style={{ position:"absolute", top:5, right:5, background:RED, borderRadius:4, padding:"2px 6px", fontSize:10, color:"#fff", fontWeight:600 }}>✏ {t.annotated}</div>}
                    </div>
                  )}

                  {/* Severity */}
                  {type==="bug"&&(
                    <div>
                      <div style={{ fontSize:12,color:SLATE,marginBottom:5,fontWeight:500 }}>{t.severity.label}</div>
                      <div style={{ display:"flex", gap:5 }}>
                        {[["low","#22C55E",t.severity.low],["medium","#F59E0B",t.severity.medium],["high",RED,t.severity.high]].map(([s,c,lbl])=>(
                          <button key={s} onClick={()=>setSeverity(s)} style={{ flex:1, padding:"7px 0", borderRadius:6, border:`1.5px solid ${severity===s?c:BORDER}`, background:severity===s?c+"15":"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:severity===s?c:SLATE, transition:"all 0.14s" }}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <div style={{ fontSize:12,color:SLATE,marginBottom:5,fontWeight:500 }}>{t.descLabel[type]}</div>
                    <textarea ref={txtRef} value={message} onChange={e=>setMessage(e.target.value)} placeholder={t.descPlaceholder[type]}
                      style={{ width:"100%", height:76, padding:"9px 11px", borderRadius:7, border:`1.5px solid ${BORDER}`, resize:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:INK, outline:"none", boxSizing:"border-box", lineHeight:1.6, background:LIGHT }}
                      onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor=BORDER}/>
                  </div>

                  {/* Repro */}
                  {type==="bug"&&(
                    <div>
                      <div style={{ fontSize:12,color:SLATE,marginBottom:5,fontWeight:500 }}>{t.reproLabel} <span style={{ color:"#bbb",fontWeight:400 }}>— {t.reproOptional}</span></div>
                      <textarea value={repro} onChange={e=>setRepro(e.target.value)} placeholder={t.reproPlaceholder}
                        style={{ width:"100%", height:58, padding:"9px 11px", borderRadius:7, border:`1.5px solid ${BORDER}`, resize:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:INK, outline:"none", boxSizing:"border-box", lineHeight:1.6, background:LIGHT }}
                        onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor=BORDER}/>
                    </div>
                  )}

                  {/* Auto-capture */}
                  <div style={{ background:LIGHT, borderRadius:7, padding:"7px 11px", border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4 }}>📎 {t.autoCapture}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"3px 12px" }}>
                      {[["URL", window.location.pathname], ["Screenshot", annotated ? "✓ "+t.annotated : "✓"]].map(([k,v])=>(
                        <span key={k} style={{ fontSize:11,color:SLATE }}><span style={{ color:"#bbb" }}>{k}: </span><span style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:SLATE }}>{v}</span></span>
                      ))}
                    </div>
                  </div>

                  <button onClick={submit} disabled={!message.trim()||saving}
                    style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", cursor:message.trim()&&!saving?"pointer":"not-allowed",
                      background:message.trim()&&!saving?INK:"#e8e0d6",
                      color:message.trim()&&!saving?PAPER:"#aaa", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6, position:"relative", overflow:"hidden" }}>
                    {message.trim()&&!saving&&<div style={{ position:"absolute",left:0,top:0,bottom:0,width:4,background:RED }}/>}
                    {saving?<><Spinner/>{t.saving}</>:<span style={{ marginLeft:saving?0:6 }}>{t.submit}</span>}
                  </button>
                </div>
              )}

              {/* SUCCESS */}
              {step==="success"&&(
                <div style={{ textAlign:"center", padding:"18px 0" }}>
                  <div style={{ width:44,height:44,borderRadius:"50%",background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 11px",color:"#fff" }}><CheckIcon/></div>
                  <div style={{ fontWeight:700,fontSize:15,color:INK,marginBottom:4,fontFamily:"'Fraunces',Georgia,serif" }}>{t.successTitle}</div>
                  <div style={{ fontSize:12,color:SLATE,lineHeight:1.65 }}>{t.successBody}</div>
                  <div style={{ marginTop:10,fontSize:10,color:"#bbb",fontFamily:"'DM Mono',monospace" }}>{t.sessionItems(items.length)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {report&&(
        <div style={{ position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:18 }}>
          <div onClick={()=>setReport(false)} style={{ position:"absolute",inset:0,background:"rgba(28,25,23,0.6)",backdropFilter:"blur(4px)" }}/>
          <div style={{ position:"relative",width:"100%",maxWidth:660,maxHeight:"85vh",borderRadius:14,overflow:"hidden",boxShadow:"0 32px 80px rgba(28,25,23,0.4)",display:"flex",flexDirection:"column" }}>
            <div style={{ background:INK, padding:"16px 20px", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <NotasLogo size="sm" inverted/>
                  <div style={{ color:"#8C8279",fontSize:10,fontFamily:"'DM Mono',monospace",marginTop:4 }}>{t.reportTitle} · {new Date().toLocaleDateString("en-US",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}</div>
                  {sessionId&&<div style={{ color:"#4a4540",fontSize:9,fontFamily:"'DM Mono',monospace",marginTop:2 }}>id: {sessionId}</div>}
                </div>
                <button onClick={()=>setReport(false)} style={{ background:"rgba(255,255,255,0.07)",border:"none",borderRadius:5,width:26,height:26,cursor:"pointer",color:"#8C8279",display:"flex",alignItems:"center",justifyContent:"center" }}><XIcon/></button>
              </div>
              <div style={{ display:"flex",gap:8,marginTop:12 }}>
                {[{label:t.bugs,count:bugs,color:RED},{label:t.feedback,count:fbs,color:"#3B82F6"},{label:t.ideas,count:ideas,color:"#8B5CF6"}].map(s=>(
                  <div key={s.label} style={{ flex:1,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"8px 11px",border:`1px solid ${s.color}28` }}>
                    <div style={{ fontSize:20,fontWeight:700,color:s.color,fontFamily:"'Fraunces',Georgia,serif" }}>{s.count}</div>
                    <div style={{ fontSize:10,color:"#8C8279",marginTop:1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:"#fff",flex:1,overflowY:"auto",padding:16 }}>
              {items.length===0
                ? <div style={{ textAlign:"center",padding:28,color:"#bbb",fontSize:13 }}>{t.noItems}</div>
                : <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {items.map((item,i)=>{
                      const cfg=TYPE_CFG[item.type];
                      return (
                        <div key={item.id} style={{ borderRadius:9,border:`1.5px solid ${cfg.border}`,overflow:"hidden" }}>
                          <div style={{ background:cfg.light,padding:"8px 11px",display:"flex",alignItems:"center",gap:8 }}>
                            <div style={{ width:24,height:24,borderRadius:6,background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0 }}>
                              {item.type==="bug"?<BugIcon/>:item.type==="feedback"?<ChatIcon/>:<BulbIcon/>}
                            </div>
                            <span style={{ fontWeight:600,fontSize:12,color:cfg.color }}>{t.types[item.type].label}</span>
                            {item.severity&&<span style={{ fontSize:10,background:cfg.color+"18",color:cfg.color,padding:"2px 6px",borderRadius:20,fontWeight:600 }}>
                              {t.severity[item.severity]}
                            </span>}
                            {item.hasAnnotation&&<span style={{ fontSize:10,background:RED+"15",color:RED,padding:"2px 6px",borderRadius:20,fontWeight:600 }}>✏ {t.annotated}</span>}
                            <span style={{ marginLeft:"auto",fontSize:10,color:"#ccc",fontFamily:"'DM Mono',monospace" }}>#{i+1}</span>
                          </div>
                          <div style={{ display:"flex",gap:10,padding:"9px 11px" }}>
                            {item.screenshot&&<img src={item.screenshot} alt="" style={{ width:88,height:52,objectFit:"cover",objectPosition:"top",borderRadius:5,border:`1px solid ${BORDER}`,flexShrink:0 }}/>}
                            <div style={{ flex:1,minWidth:0 }}>
                              <p style={{ margin:"0 0 4px",fontSize:13,color:INK,lineHeight:1.5 }}>{item.message}</p>
                              {item.repro&&<p style={{ margin:"0 0 5px",fontSize:11,color:SLATE,fontStyle:"italic",lineHeight:1.4 }}>↳ {item.repro}</p>}
                              <div style={{ display:"flex",flexWrap:"wrap",gap:"2px 9px" }}>
                                {[["📄",item.meta.page],["🕐",new Date(item.meta.timestamp).toLocaleTimeString()],
                                  ...(item.meta.consoleErrors.length?[["⚠",t.errors(item.meta.consoleErrors.length)]]:[] ),
                                ].map(([icon,val],j)=>(
                                  <span key={j} style={{ fontSize:10,color:icon==="⚠"?"#C0392B":"#bbb",fontFamily:"'DM Mono',monospace" }}>{icon} {val}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
            <div style={{ background:LIGHT,padding:"11px 16px",borderTop:`1px solid ${BORDER}`,display:"flex",gap:7,flexShrink:0 }}>
              <button style={{ flex:1,padding:"8px 0",borderRadius:7,border:`1.5px solid ${BORDER}`,background:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:SLATE }}>{t.exportJson}</button>
              <button style={{ flex:2,padding:"8px 0",borderRadius:7,border:"none",background:INK,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:PAPER }}>{t.downloadPdf}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
