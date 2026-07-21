// ─── Supabase client & helpers ───────────────────────────────────────────────
export const SUPABASE_URL      = "https://wutapcogyekvxrvynsxi.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGFwY29neWVrdnhydnluc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzE0MTYsImV4cCI6MjA5OTIwNzQxNn0.-UxP9w1nNfE3kIRUSX7eOa4PH4MNeq5CXb2Yy5eCX-c";

export async function sbFetch(path, options = {}, token = null) {
  const authKey = token || SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${authKey}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
  return data; // { access_token, user, ... }
}

export async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` },
  });
}

export function getStoredSession() {
  try { return JSON.parse(localStorage.getItem("notas_session")); } catch { return null; }
}
export function storeSession(session) {
  localStorage.setItem("notas_session", JSON.stringify(session));
}
export function clearSession() {
  localStorage.removeItem("notas_session");
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
// Queries the session_report VIEW (defined in the original schema SQL,
// pre-aggregating bugs/feedback/ideas/total_items per session) instead of
// the bare feedback_sessions table. Columns are aliased back to the exact
// names the raw table used, so every other fetchSessions() consumer needs
// zero changes — this just makes accurate counts available on every
// session in the list, without a per-session fetchSessionItems call.
// (The view's heavy items json_agg column is deliberately left out of the
// select — nothing here needs the full item payload, just the counts.)
//
// The view was documented as "optional" in the original schema SQL, so it
// may not actually exist in every deployment of this database. Falls back
// to the bare table (old behavior — counts show as 0 until a session is
// expanded) if the view query fails, so a missing view degrades gracefully
// instead of breaking the whole session list.
export async function fetchSessions(token) {
  try {
    return await sbFetch(
      "/session_report?select=id:session_id,app_name,client_name,status,created_at:session_started,closed_at:session_ended,total_items,bugs,feedback,ideas&order=session_started.desc",
      {}, token
    );
  } catch (err) {
    console.warn("Notas: session_report view unavailable, falling back to feedback_sessions (counts won't show until a session is expanded) —", err.message);
    return sbFetch("/feedback_sessions?select=*&order=created_at.desc", {}, token);
  }
}

export async function fetchSessionItems(sessionId, token) {
  return sbFetch(`/feedback_items?session_id=eq.${sessionId}&select=*&order=created_at.asc`, {}, token);
}

export async function closeSession(sessionId, token) {
  return sbFetch(`/feedback_sessions?id=eq.${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "closed", closed_at: new Date().toISOString() }),
  }, token);
}

export async function archiveSession(sessionId, token) {
  return sbFetch(`/feedback_sessions?id=eq.${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" }),
  }, token);
}

export async function unarchiveSession(sessionId, token) {
  return sbFetch(`/feedback_sessions?id=eq.${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "closed" }),
  }, token);
}

export async function deleteSession(sessionId, token) {
  // Items are deleted via cascade (on delete cascade in schema)
  return sbFetch(`/feedback_sessions?id=eq.${sessionId}`, {
    method: "DELETE",
    prefer: "return=minimal",
  }, token);
}
export async function createSession(appName, clientName, token) {
  const data = await sbFetch("/feedback_sessions", {
    method: "POST",
    body: JSON.stringify({ app_name: appName, client_name: clientName, status: "active" }),
  }, token);
  return data[0];
}

export async function saveItem(sessionId, item, token) {
  const data = await sbFetch("/feedback_items", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      type: item.type,
      message: item.message,
      repro: item.repro || null,
      severity: item.severity || null,
      screenshot_url: item.screenshotUrl || null,
      has_annotation: item.hasAnnotation || false,
      meta: item.meta,
    }),
  }, token);
  return data[0];
}

export async function uploadScreenshot(sessionId, itemId, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${sessionId}/${itemId}.png`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/screenshots/${path}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "image/png" },
    body: blob,
  });
  if (!res.ok) throw new Error("Upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/screenshots/${path}`;
}
