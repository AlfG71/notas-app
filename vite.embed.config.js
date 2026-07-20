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
// as part of the normal deploy. emptyOutDir only clears the embed/
// subfolder, not the rest of dist/.
export default defineConfig({
  plugins: [react()],
  publicDir: false, // don't re-copy public/ (favicon etc.) into dist/embed
  build: {
    outDir: "dist/embed",
    emptyOutDir: true,
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
