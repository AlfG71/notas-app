// ─── Real page screenshot capture via html2canvas ────────────────────────────
// html2canvas is imported dynamically so it's only pulled into the bundle
// when a screenshot is actually requested (keeps the initial embed light).

let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (!html2canvasPromise) {
    html2canvasPromise = import("html2canvas").then(mod => mod.default || mod);
  }
  return html2canvasPromise;
}

// Capture the host page, excluding the widget's own DOM subtree so the
// widget never photographs itself.
export async function captureScreenshot(excludeEl) {
  try {
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(document.body, {
      ignoreElements: el => !!excludeEl && excludeEl.contains(el),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null,
      scale: 1,
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Notas: screenshot capture failed —", err?.message || err);
    return null;
  }
}
