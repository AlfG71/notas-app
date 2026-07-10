import { useState } from "react";
import { signIn, storeSession } from "./supabase.js";

const INK = "#1C1917", PAPER = "#F5F0E8", RED = "#E8562A", BORDER = "#E2D9CC", LIGHT = "#FFF8F0", SLATE = "#64748b";

function NotasLogo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:32 }}>
      <div style={{ width:40, height:40, borderRadius:10, background:INK, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
          <path d="M3 14V4l5 6V4M13 4v10" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13l4-3" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:28, fontWeight:700, color:INK, letterSpacing:"-0.02em" }}>notas</span>
    </div>
  );
}

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const session = await signIn(email, password);
      storeSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:PAPER, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:400, padding:24 }}>
        <NotasLogo/>
        <div style={{ background:"#fff", borderRadius:14, padding:32, boxShadow:`0 4px 24px rgba(28,25,23,0.08)`, border:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:18, fontWeight:600, color:INK, marginBottom:6, fontFamily:"'Fraunces',Georgia,serif" }}>Dashboard login</div>
          <div style={{ fontSize:13, color:SLATE, marginBottom:24 }}>For your eyes only.</div>

          {error && (
            <div style={{ background:"#FEF2F0", border:"1px solid #FADBD8", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#C0392B", marginBottom:16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:SLATE, display:"block", marginBottom:5 }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="you@example.com"
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${BORDER}`, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:INK, outline:"none", boxSizing:"border-box", background:LIGHT }}
                onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor=BORDER}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:SLATE, display:"block", marginBottom:5 }}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${BORDER}`, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:INK, outline:"none", boxSizing:"border-box", background:LIGHT }}
                onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor=BORDER}/>
            </div>
            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"11px 0", borderRadius:9, border:"none", cursor:loading?"not-allowed":"pointer", background:loading?"#ccc":INK, color:PAPER, fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", marginTop:4, position:"relative", overflow:"hidden" }}>
              {!loading && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:RED }}/>}
              <span style={{ marginLeft:loading?0:6 }}>{loading ? "Signing in..." : "Sign in →"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
