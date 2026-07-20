// Public entry point for the npm-importable Notas widget.
// Usage in a React/Next.js client project:
//
//   import { NotasWidget } from "notas-widget";
//   // or, until this is published: import { NotasWidget } from "@gonzaleztech/notas-widget";
//
//   export default function Layout({ children }) {
//     return (
//       <>
//         {children}
//         <NotasWidget sessionId={SESSION_ID} appName="Client Portal" />
//       </>
//     );
//   }
//
// react, react-dom, and html2canvas are peer dependencies — the host app
// supplies them, so this build stays small and doesn't duplicate React.
export { default as NotasWidget } from "./NotasWidget";
