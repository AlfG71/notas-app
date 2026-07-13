import { useState, useEffect } from "react";
import { fetchSessions, fetchSessionItems, closeSession, signOut, clearSession, sbFetch } from "./supabase.js";

const INK = "#1C1917", PAPER = "#F5F0E8", RED = "#E8562A", GREEN = "#2D6A4F";
const BORDER = "#E2D9CC", LIGHT = "#FFF8F0", SLATE = "#64748b";

const TYPE_CFG = {
  bug:      { color:"#C0392B", light:"#FEF2F0", border:"#FADBD8", label:"Bug"      },
  feedback: { color:"#1A5276", light:"#EBF5FB", border:"#D6EAF8", label:"Feedback" },
  idea:     { color:"#5B2C6F", light:"#F5EEF8", border:"#E8DAEF", label:"Idea"     },
};

const SEV_COLOR = { low:"#22C55E", medium:"#F59E0B", high:RED };

// ─── Icons ────────────────────────────────────────────────────────────────────
const Svg = ({ children, s=18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const BugIcon  = () => <Svg s={14}><path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 8c-3.3 0-6 2.7-6 6v2c0 3.3 2.7 6 6 6s6-2.7 6-6v-2c0-3.3-2.7-6-6-6z"/><path d="M6 13H2M22 13h-4M6 17l-3 2M18 17l3 2"/></Svg>;
const ChatIcon = () => <Svg s={14}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const BulbIcon = () => <Svg s={14}><path d="M9 21h6M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/></Svg>;
const CheckIcon = () => <Svg s={14}><path d="M20 6L9 17l-5-5"/></Svg>;
const LogoutIcon = () => <Svg s={14}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Svg>;
const ChevronIcon = ({ open }) => <Svg s={16}><path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/></Svg>;
const RefreshIcon = () => <Svg s={14}><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Svg>;

function NotasLogo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(255,255,255,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M3 14V4l5 6V4M13 4v10" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13l4-3" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:16, fontWeight:700, color:PAPER, letterSpacing:"-0.02em" }}>notas</span>
      <span style={{ fontSize:10, background:"rgba(232,86,42,0.25)", color:"#F5B8A0", padding:"2px 7px", borderRadius:20 }}>dashboard</span>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ session, token, onStatusChange }) {
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  async function loadItems() {
    if (items) { setOpen(o=>!o); return; }
    setLoading(true);
    try {
      const data = await fetchSessionItems(session.id, token);
      setItems(data);
      setOpen(true);
    } catch { setItems([]); setOpen(true); }
    finally { setLoading(false); }
  }

  async function handleClose() {
    if (!confirm("Mark this session as closed?")) return;
    setClosing(true);
    try { await closeSession(session.id, token); onStatusChange(); }
    catch { alert("Failed to close session"); }
    finally { setClosing(false); }
  }

  function generateReport() {
    if (!items) return;
    const lines = [
      `NOTAS SESSION REPORT`,
      `═══════════════════════════════════`,
      `Client:  ${session.client_name || "—"}`,
      `App:     ${session.app_name}`,
      `Date:    ${new Date(session.created_at).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}`,
      `Status:  ${session.status}`,
      `Total:   ${items.length} nota${items.length !== 1 ? "s" : ""}`,
      ``,
      `BUGS:     ${items.filter(i=>i.type==="bug").length}`,
      `FEEDBACK: ${items.filter(i=>i.type==="feedback").length}`,
      `IDEAS:    ${items.filter(i=>i.type==="idea").length}`,
      ``,
      `───────────────────────────────────`,
      `ITEMS`,
      `───────────────────────────────────`,
      ...items.map((item, i) => [
        ``,
        `#${i+1} [${item.type.toUpperCase()}]${item.severity ? ` — ${item.severity.toUpperCase()}` : ""}`,
        `Page:    ${item.meta?.page || "—"}`,
        `Time:    ${new Date(item.created_at).toLocaleTimeString()}`,
        `Message: ${item.message}`,
        item.repro ? `Steps:   ${item.repro}` : null,
        item.screenshot_url ? `Screenshot: ${item.screenshot_url}` : null,
        item.meta?.consoleErrors?.length ? `Errors:  ${item.meta.consoleErrors.join("; ")}` : null,
      ].filter(Boolean).join("\n")),
    ].join("\n");

    const blob = new Blob([lines], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notas-report-${session.client_name || session.id.slice(0,8)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ session, items }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notas-${session.client_name || session.id.slice(0,8)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  const bugs     = items ? items.filter(i=>i.type==="bug").length : session.bugs || 0;
  const feedback = items ? items.filter(i=>i.type==="feedback").length : 0;
  const ideas    = items ? items.filter(i=>i.type==="idea").length : 0;
  const isActive = session.status === "active";

  return (
    <div style={{ borderRadius:12, border:`1.5px solid ${open ? RED+"40" : BORDER}`, overflow:"hidden", transition:"border-color 0.2s" }}>
      {/* Card header */}
      <div style={{ padding:"14px 16px", background:"#fff", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={loadItems}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <div style={{ fontWeight:600, fontSize:14, color:INK }}>{session.client_name || "Unnamed client"}</div>
            <div style={{ fontSize:11, color:SLATE }}>·</div>
            <div style={{ fontSize:12, color:SLATE }}>{session.app_name}</div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, background:isActive?"#F0FDF4":"#F8FAFC", color:isActive?GREEN:SLATE, border:`1px solid ${isActive?"#BBF7D0":BORDER}` }}>
                {isActive ? "● active" : "✓ closed"}
              </span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:11, color:SLATE, fontFamily:"'DM Mono',monospace" }}>{new Date(session.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            <span style={{ fontSize:11, color:"#C0392B" }}>🐛 {bugs}</span>
            <span style={{ fontSize:11, color:"#1A5276" }}>💬 {feedback}</span>
            <span style={{ fontSize:11, color:"#5B2C6F" }}>💡 {ideas}</span>
          </div>
        </div>
        <div style={{ color:SLATE, transition:"transform 0.2s", transform:open?"rotate(0)":"rotate(0)" }}>
          {loading ? <span style={{ fontSize:11, color:SLATE }}>Loading...</span> : <ChevronIcon open={open}/>}
        </div>
      </div>

      {/* Expanded items */}
      {open && items && (
        <div style={{ borderTop:`1px solid ${BORDER}`, background:LIGHT }}>
          {/* Action bar */}
          <div style={{ padding:"10px 16px", display:"flex", gap:8, borderBottom:`1px solid ${BORDER}` }}>
            {isActive && (
              <button onClick={handleClose} disabled={closing}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:`1.5px solid ${GREEN}30`, background:"#F0FDF4", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:GREEN }}>
                <CheckIcon/>{closing?"Closing...":"Close session"}
              </button>
            )}
            <button onClick={generateReport}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:`1.5px solid ${BORDER}`, background:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:SLATE }}>
              ↓ Download report
            </button>
            <button onClick={exportJSON}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:`1.5px solid ${BORDER}`, background:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:SLATE }}>
              ↓ Export JSON
            </button>
            <span style={{ marginLeft:"auto", fontSize:11, color:SLATE, alignSelf:"center", fontFamily:"'DM Mono',monospace" }}>
              {items.length} nota{items.length!==1?"s":""}
            </span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding:32, textAlign:"center", color:SLATE, fontSize:13 }}>No notas in this session yet.</div>
          ) : (
            <div style={{ padding:14, display:"flex", flexDirection:"column", gap:10 }}>
              {items.map((item, i) => {
                const cfg = TYPE_CFG[item.type] || TYPE_CFG.feedback;
                const isSelected = selectedItem === item.id;
                return (
                  <div key={item.id} style={{ borderRadius:9, border:`1.5px solid ${isSelected?cfg.color:cfg.border}`, overflow:"hidden", background:"#fff" }}>
                    {/* Item header */}
                    <div style={{ background:cfg.light, padding:"8px 12px", display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} onClick={()=>setSelectedItem(isSelected?null:item.id)}>
                      <div style={{ width:22, height:22, borderRadius:6, background:cfg.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}>
                        {item.type==="bug"?<BugIcon/>:item.type==="feedback"?<ChatIcon/>:<BulbIcon/>}
                      </div>
                      <span style={{ fontWeight:600, fontSize:12, color:cfg.color }}>{cfg.label}</span>
                      {item.severity && (
                        <span style={{ fontSize:10, background:SEV_COLOR[item.severity]+"20", color:SEV_COLOR[item.severity], padding:"2px 7px", borderRadius:20, fontWeight:600, textTransform:"capitalize" }}>
                          {item.severity}
                        </span>
                      )}
                      {item.has_annotation && <span style={{ fontSize:10, background:RED+"15", color:RED, padding:"2px 6px", borderRadius:20, fontWeight:600 }}>✏ marked</span>}
                      <span style={{ marginLeft:"auto", fontSize:10, color:"#ccc", fontFamily:"'DM Mono',monospace" }}>#{i+1} · {new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>

                    {/* Item body */}
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", gap:12 }}>
                        {item.screenshot_url && (
                          <a href={item.screenshot_url} target="_blank" rel="noreferrer" style={{ flexShrink:0 }}>
                            <img src={item.screenshot_url} alt="screenshot"
                              style={{ width:100, height:62, objectFit:"cover", objectPosition:"top", borderRadius:6, border:`1px solid ${BORDER}`, display:"block" }}/>
                          </a>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:"0 0 6px", fontSize:13, color:INK, lineHeight:1.55 }}>{item.message}</p>
                          {item.repro && (
                            <p style={{ margin:"0 0 6px", fontSize:12, color:SLATE, fontStyle:"italic", lineHeight:1.45, borderLeft:`2px solid ${BORDER}`, paddingLeft:8 }}>
                              ↳ {item.repro}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Meta — always visible */}
                      <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7, background:LIGHT, border:`1px solid ${BORDER}`, display:"flex", flexWrap:"wrap", gap:"3px 14px" }}>
                        {[
                          ["📄", item.meta?.page],
                          ["🔗", item.meta?.url],
                          ["🌐", item.meta?.browser],
                          ["🖥", item.meta?.os],
                          ["📐", item.meta?.viewport],
                          ...(item.meta?.consoleErrors?.length ? [["⚠", `${item.meta.consoleErrors.length} console error(s)`]] : []),
                          ...(item.meta?.networkErrors?.length ? [["🔴", item.meta.networkErrors[0]]] : []),
                        ].filter(([,v])=>v).map(([icon,val],j)=>(
                          <span key={j} style={{ fontSize:10, color: icon==="⚠"||icon==="🔴" ? "#C0392B" : SLATE, fontFamily:"'DM Mono',monospace" }}>{icon} {val}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────
function NewSessionModal({ token, onClose, onCreated }) {
  const [clientName, setClientName] = useState("");
  const [appName, setAppName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [result, setResult]         = useState(null);
  const [focusedField, setFocused]  = useState(null);

  async function handleCreate() {
    if (!clientName.trim() || !appName.trim()) return;
    setCreating(true);
    try {
      const data = await sbFetch("/feedback_sessions", {
        method: "POST",
        body: JSON.stringify({ app_name: appName.trim(), client_name: clientName.trim(), status: "active" }),
      }, token);
      const session = data[0];
      const url = `${window.location.origin}?session=${session.id}`;
      setResult({ url, sessionId: session.id });
      onCreated();
    } catch (e) { alert("Failed to create session: " + e.message); }
    finally { setCreating(false); }
  }

  function copyUrl() {
    navigator.clipboard.writeText(result.url);
  }

  const inputStyle = (field) => ({
    width:"100%", padding:"10px 12px", borderRadius:8,
    border:`1.5px solid ${focusedField===field ? RED : BORDER}`,
    fontFamily:"'DM Sans',sans-serif", fontSize:14, color:INK,
    outline:"none", boxSizing:"border-box", background:LIGHT,
    transition:"border-color 0.15s",
  });

  const canCreate = clientName.trim() && appName.trim() && !creating;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      {/* Backdrop — pointer-events only on the backdrop itself, not the modal */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.55)", backdropFilter:"blur(4px)", zIndex:0 }}/>
      <div style={{ position:"relative", width:"100%", maxWidth:460, borderRadius:14, overflow:"hidden", boxShadow:"0 24px 64px rgba(28,25,23,0.3)", background:"#fff", zIndex:1 }}>
        <div style={{ background:INK, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:PAPER, fontWeight:600, fontSize:15, fontFamily:"'Fraunces',Georgia,serif" }}>New session</div>
            <div style={{ color:"#8C8279", fontSize:11, marginTop:2 }}>Creates a unique link to send to your client</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:6, width:26, height:26, cursor:"pointer", color:"#8C8279", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✕</button>
        </div>

        <div style={{ padding:20 }}>
          {!result ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:SLATE, display:"block", marginBottom:5 }}>Client name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onFocus={() => setFocused("client")}
                  onBlur={() => setFocused(null)}
                  placeholder="e.g. Rosa Mendez"
                  style={inputStyle("client")}
                />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:SLATE, display:"block", marginBottom:5 }}>App name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  onFocus={() => setFocused("app")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Restaurant POS"
                  style={inputStyle("app")}
                />
              </div>
              <button onClick={handleCreate} disabled={!canCreate}
                style={{ width:"100%", padding:"11px 0", borderRadius:9, border:"none",
                  cursor: canCreate ? "pointer" : "not-allowed",
                  background: canCreate ? INK : "#e8e0d6",
                  color: canCreate ? PAPER : "#aaa",
                  fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
                  position:"relative", overflow:"hidden", transition:"all 0.2s" }}>
                {canCreate && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:RED }}/>}
                <span style={{ marginLeft: canCreate ? 6 : 0 }}>{creating ? "Creating..." : "Create session →"}</span>
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ textAlign:"center", padding:"8px 0" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:GREEN, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", color:"#fff", fontSize:20 }}>✓</div>
                <div style={{ fontWeight:700, fontSize:15, color:INK, fontFamily:"'Fraunces',Georgia,serif" }}>Session created!</div>
                <div style={{ fontSize:12, color:SLATE, marginTop:4 }}>Copy this link and send it to your client</div>
              </div>
              <div style={{ background:LIGHT, borderRadius:9, border:`1.5px solid ${BORDER}`, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:SLATE, marginBottom:4, fontWeight:500 }}>Session URL</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:INK, wordBreak:"break-all", lineHeight:1.5 }}>{result.url}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={copyUrl}
                  style={{ flex:2, padding:"10px 0", borderRadius:8, border:"none", background:INK, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:PAPER, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:RED }}/>
                  <span style={{ marginLeft:6 }}>Copy link</span>
                </button>
                <button onClick={onClose}
                  style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1.5px solid ${BORDER}`, background:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:SLATE }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ authSession, onLogout }) {
  const [sessions, setSessions]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState("all");
  const [showNewSession, setShowNewSession] = useState(false);
  const token = authSession?.access_token;

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await fetchSessions(token);
      setSessions(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  async function handleLogout() {
    try { await signOut(token); } catch {}
    clearSession(); onLogout();
  }

  const filtered = sessions
    ? filter === "all" ? sessions : sessions.filter(s=>s.status===filter)
    : [];

  const totalActive = sessions?.filter(s=>s.status==="active").length || 0;
  const totalClosed = sessions?.filter(s=>s.status==="closed").length || 0;

  return (
    <div style={{ minHeight:"100vh", background:PAPER, fontFamily:"'DM Sans',sans-serif" }}>
      {showNewSession && <NewSessionModal token={token} onClose={()=>setShowNewSession(false)} onCreated={load}/>}
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <header style={{ background:INK, padding:"0 24px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 12px rgba(0,0,0,0.3)", position:"sticky", top:0, zIndex:100 }}>
        <NotasLogo/>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, color:"#8C8279", fontFamily:"'DM Mono',monospace" }}>{authSession?.user?.email}</span>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", cursor:"pointer", color:"#8C8279", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            <RefreshIcon/> Refresh
          </button>
          <button onClick={()=>setShowNewSession(true)}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 14px", borderRadius:6, border:"none", background:RED, cursor:"pointer", color:"#fff", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            + New session
          </button>
          <button onClick={handleLogout}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", cursor:"pointer", color:"#8C8279", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            <LogoutIcon/> Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth:860, margin:"0 auto", padding:"28px 20px" }}>
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total sessions", value: sessions?.length ?? "—", color:INK },
            { label:"Active",         value: totalActive,               color:GREEN },
            { label:"Closed",         value: totalClosed,               color:SLATE },
          ].map(s=>(
            <div key={s.label} style={{ background:"#fff", borderRadius:10, padding:"16px 18px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:"'Fraunces',Georgia,serif" }}>{s.value}</div>
              <div style={{ fontSize:12, color:SLATE, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {["all","active","closed"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${filter===f?RED:BORDER}`, background:filter===f?RED:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:filter===f?"#fff":SLATE, transition:"all 0.15s", textTransform:"capitalize" }}>
              {f}
            </button>
          ))}
          <span style={{ marginLeft:"auto", fontSize:12, color:SLATE, alignSelf:"center" }}>
            {filtered.length} session{filtered.length!==1?"s":""}
          </span>
        </div>

        {/* Session list */}
        {loading && <div style={{ textAlign:"center", padding:48, color:SLATE }}>Loading sessions...</div>}
        {error   && <div style={{ textAlign:"center", padding:48, color:"#C0392B", fontSize:13 }}>Error: {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:48, color:SLATE, fontSize:13 }}>
            {filter==="all" ? "No sessions yet. Send a client the Notas URL to get started." : `No ${filter} sessions.`}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(s=>(
              <SessionCard key={s.id} session={s} token={token} onStatusChange={load}/>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
