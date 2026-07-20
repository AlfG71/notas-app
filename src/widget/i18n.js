// ─── i18n ────────────────────────────────────────────────────────────────────
export const T = {
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

export function harvestMeta() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Edg/"))         browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("OPR/"))    browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Firefox/")) browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] || ""}`;
  else if (ua.includes("Chrome/")) browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] || ""}`;

  let os = "Unknown";
  if (ua.includes("Mac OS X"))  os = `macOS ${ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""}`;
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
