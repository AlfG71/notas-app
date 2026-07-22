import { PAPER, SLATE, BORDER } from "./theme";

// Shared EN/ES toggle pill — used both inside NotasWidget's own header and
// on the standalone session page (App.jsx), so language switching looks
// identical wherever it appears.
export default function LangToggle({ lang, setLang, inverted }) {
  return (
    <button onClick={() => setLang(l => (l === "en" ? "es" : "en"))}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, border: `1.5px solid ${inverted ? "rgba(255,255,255,0.18)" : BORDER}`, background: inverted ? "rgba(255,255,255,0.07)" : PAPER, cursor: "pointer", color: inverted ? "#d4c9b8" : SLATE, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>
      <span style={{ fontSize: 12 }}>{lang === "en" ? "🇺🇸" : "🇪🇸"}</span>
      {lang === "en" ? "EN" : "ES"}
      <span style={{ fontSize: 9, opacity: 0.6 }}>⇄</span>
    </button>
  );
}
