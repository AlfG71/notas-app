// ─── Real page screenshot capture via html2canvas ────────────────────────────
// html2canvas-pro is imported dynamically so it's only pulled into the
// bundle when a screenshot is actually requested (keeps the initial embed
// light). We use the "-pro" fork instead of stock html2canvas because
// stock html2canvas can't parse modern CSS color functions (oklch, oklab,
// lab, color()) that Tailwind v4 emits by default — it throws
// "Attempting to parse an unsupported color function" and the capture
// silently fails. html2canvas-pro is a drop-in, API-compatible fork that
// adds support for those color functions.

let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (!html2canvasPromise) {
    html2canvasPromise = import("html2canvas-pro").then(mod => mod.default || mod);
  }
  return html2canvasPromise;
}

// Capture the host page, excluding the widget's own DOM subtree so the
// widget never photographs itself.
//
// Two things this deliberately controls, both fixing real reported bugs:
//
// 1. Viewport-only capture. html2canvas defaults to rasterizing the whole
//    scrollable document.body — on a long page that produces an extremely
//    tall, narrow-aspect-ratio image. AnnotationCanvas caps its buffer to
//    MAX_CANVAS_W x MAX_CANVAS_H while preserving aspect ratio, so a very
//    tall capture gets shrunk far more in width than height, then gets
//    stretched back out to the panel's display width — that's what
//    produced "blurry and oversized" captures, and (since the modal has no
//    max-height/scroll) also pushed the toolbar off the top of the screen.
//    Passing explicit width/height/x/y restricts html2canvas to exactly
//    what's currently visible in the viewport, which also better matches
//    what a tester actually meant to point at.
//
// 2. Device-pixel-ratio-aware scale. Hardcoding scale:1 captures at CSS
//    pixel density, which looks soft/blurry once displayed at the same CSS
//    size on a Retina/HiDPI screen. Using the real devicePixelRatio (capped
//    at 2 to keep the resulting PNG a sane size) keeps captures crisp.
export async function captureScreenshot(excludeEl) {
  try {
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(document.body, {
      ignoreElements: el => !!excludeEl && excludeEl.contains(el),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Notas: screenshot capture failed —", err?.message || err);
    return null;
  }
}
