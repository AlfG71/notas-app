import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Builds the npm-importable widget for React/Next.js client projects.
// react, react-dom, and html2canvas are left external — the host project
// already has them, so this bundle only ships Notas' own code.
//
//   npm run build:widget
//   → dist-widget/notas-widget.es.js   (import { NotasWidget } from "...")
//   → dist-widget/notas-widget.cjs.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-widget",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/widget/index.js"),
      name: "NotasWidget",
      fileName: format => `notas-widget.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "html2canvas"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          html2canvas: "html2canvas",
        },
      },
    },
  },
});
