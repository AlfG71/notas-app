// Vanilla-JS embed entry point. Built by vite.embed.config.js into a single
// self-contained notas.js (React + ReactDOM + html2canvas all bundled in),
// so it works as a plain <script> tag on any non-React stack.
//
// Two-line usage in any client's HTML:
//
//   <script src="https://notas-app-fawn.vercel.app/embed/notas.js"></script>
//   <script>Notas.init({ sessionId: "abc123", appName: "My App" });</script>
//
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import NotasWidget from "../src/widget/NotasWidget";

let root = null;
let container = null;

function init(options = {}) {
  const { sessionId, appName, lang, position } = options;

  if (!sessionId) {
    console.error("Notas.init: a `sessionId` is required.");
    return;
  }

  // Idempotent — re-calling init() replaces the previous instance instead
  // of stacking widgets on the page.
  if (root) destroy();

  container = document.createElement("div");
  container.id = "notas-widget-root";
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(
    createElement(NotasWidget, { sessionId, appName, lang, position })
  );
}

function destroy() {
  if (root) { root.unmount(); root = null; }
  if (container?.parentNode) { container.parentNode.removeChild(container); container = null; }
}

const Notas = { init, destroy };

// Expose as a global for plain <script> tag usage.
if (typeof window !== "undefined") {
  window.Notas = Notas;
}

export default Notas;
