import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Builds the vanilla drop-in script for non-React stacks. React, ReactDOM,
// and html2canvas are all bundled in (nothing external) so a host page
// with zero JS tooling can use it with a plain <script> tag.
//
//   npm run build:embed
//   → dist/embed/notas.js   (defines window.Notas.init({ sessionId, ... }))
//
// Output goes into dist/embed — the same directory Vercel deploys for the
// main app — so notas.js ships live at https://notas-app-fawn.vercel.app/embed/notas.js
// as part of the normal deploy. emptyOutDir is OFF on purpose: the main
// `vite build` runs first and copies public/embed/* (static files meant to
// live under /embed/) into dist/embed — this build must add notas.js
// alongside that, not wipe it. The lib output filename is a fixed
// "notas.js" (never hashed), so there's no stale-file buildup risk from
// skipping emptyOutDir.
export default defineConfig({
  plugins: [react()],
  publicDir: false, // don't re-copy public/ (favicon etc.) into dist/embed
  // React's production build reads process.env.NODE_ENV at module-load time.
  // A regular `vite build` gets this replaced for free; lib-mode builds
  // don't do it automatically, and browsers have no `process` global — so
  // without this define, the bundle throws a ReferenceError as soon as it
  // loads and window.Notas never gets assigned.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist/embed",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "embed/mount.js"),
      name: "Notas",
      fileName: () => "notas.js",
      formats: ["iife"],
    },
    rollupOptions: {
      // Intentionally no `external` — everything ships in one file.
      output: {
        extend: true,
      },
    },
  },
});
