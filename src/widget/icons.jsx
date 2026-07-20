// ─── ICONS ────────────────────────────────────────────────────────────────────
export const Svg = ({ children, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

export const BugIcon   = () => <Svg><path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 8c-3.3 0-6 2.7-6 6v2c0 3.3 2.7 6 6 6s6-2.7 6-6v-2c0-3.3-2.7-6-6-6z"/><path d="M6 13H2M22 13h-4M6 17l-3 2M18 17l3 2M6 9l-3-2M18 9l3-2"/></Svg>;
export const ChatIcon  = () => <Svg><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
export const BulbIcon  = () => <Svg><path d="M9 21h6M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/></Svg>;
export const PenIcon   = () => <Svg s={15}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>;
export const ArrIcon   = () => <Svg s={15}><path d="M5 12h14M12 5l7 7-7 7"/></Svg>;
export const BoxIcon   = () => <Svg s={15}><path d="M3 3h18v18H3z"/></Svg>;
export const ErasIcon  = () => <Svg s={15}><path d="M20 20H7L3 16l13-13 7 7-3 3M6 17l3-3"/></Svg>;
export const UndoIcon  = () => <Svg s={15}><path d="M3 7v6h6M3 13C5 8 9.5 5 15 5a9 9 0 0 1 9 9"/></Svg>;
export const XIcon     = () => <Svg s={14}><path d="M18 6L6 18M6 6l12 12"/></Svg>;
export const CheckIcon = () => <Svg><path d="M20 6L9 17l-5-5"/></Svg>;
export const ReportIc  = () => <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></Svg>;
export const TextIcon  = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);
export const Spinner = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
    </path>
  </svg>
);

// ─── NOTAS WORDMARK ───────────────────────────────────────────────────────────
export function NotasLogo({ size = "md", inverted = false }) {
  const INK_C = "#1C1917", PAPER_C = "#F5F0E8", RED_C = "#E8562A", BORDER_C = "#E2D9CC";
  const color = inverted ? PAPER_C : INK_C;
  const sizes = { sm: { box: 22, font: 11 }, md: { box: 28, font: 14 }, lg: { box: 36, font: 18 } };
  const s = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: s.box, height: s.box, borderRadius: 7, background: inverted ? "rgba(255,255,255,0.12)" : PAPER_C, border: `1.5px solid ${inverted ? "rgba(255,255,255,0.2)" : BORDER_C}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        <svg width={s.box * 0.6} height={s.box * 0.6} viewBox="0 0 18 18" fill="none">
          <path d="M3 14V4l5 6V4M13 4v10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13l4-3" stroke={RED_C} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: s.font, fontWeight: 700, color, letterSpacing: "-0.02em" }}>notas</span>
    </div>
  );
}
