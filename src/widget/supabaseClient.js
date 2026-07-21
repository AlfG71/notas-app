// Self-contained Supabase client for NotasWidget — deliberately duplicated
// from ../supabase.js rather than imported from it. That file also holds
// dashboard/auth-only code (signIn, fetchSessions, closeSession, ...) which
// has no business existing outside this repo. This file holds only what
// NotasWidget itself needs, so the whole `widget/` folder can be copied
// wholesale into another React/Next.js project with zero other
// dependencies on this repo.
//
// Every project that embeds Notas reports into this same backend — that's
// intentional. One Supabase project, one dashboard, sessions scoped by
// session_id per client/app. Don't point this at a different project
// unless you actually want a separate, disconnected Notas instance.
export const SUPABASE_URL      = "https://wutapcogyekvxrvynsxi.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGFwY29neWVrdnhydnluc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzE0MTYsImV4cCI6MjA5OTIwNzQxNn0.-UxP9w1nNfE3kIRUSX7eOa4PH4MNeq5CXb2Yy5eCX-c";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Lets the widget check whether the session it's pointed at is still
// active, so closing a session from the dashboard actually turns the
// embedded widget off in deployed apps — no redeploy needed. Fails open
// (treated as active) on network errors so a transient hiccup doesn't take
// down feedback capture; only an explicit non-"active" status hides it.
export async function getSessionStatus(sessionId) {
  const data = await sbFetch(`/feedback_sessions?id=eq.${sessionId}&select=status`);
  return data?.[0]?.status ?? null; // null = session not found
}

export async function saveItem(sessionId, item) {
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
  });
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
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/screenshots/${path}`;
}
