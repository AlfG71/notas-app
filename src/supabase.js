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
export async function fetchSessions(token) {
  return sbFetch("/feedback_sessions?select=*&order=created_at.desc", {}, token);
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
