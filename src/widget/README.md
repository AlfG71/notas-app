# NotasWidget — reuse in another client project

This folder is self-contained on purpose. To drop Notas into another
React/Next.js project you're building, copy the entire `widget/` folder
into that project's `src/` (or equivalent) — nothing else from this repo
is needed. No publishing, no registry, no auth tokens.

## What to copy

```
src/widget/   ← the whole folder, as-is
```

Every file inside imports only from siblings in this same folder, plus
`react`, `react-dom`, and `html2canvas-pro`. Nothing reaches back into the
rest of this repo (`../supabase.js`, `../App.jsx`, etc. are never
imported from here — that's `supabaseClient.js`'s whole reason for
existing as a separate, deliberately duplicated file from the dashboard's
Supabase client).

## Dependencies the host project needs

```
npm install react react-dom html2canvas-pro
```

(react/react-dom are almost certainly already there if it's a React app.
Use `html2canvas-pro`, not stock `html2canvas` — the "-pro" fork adds
support for modern CSS color functions like `oklch()`/`oklab()`, which
stock html2canvas can't parse and which Tailwind v4 emits by default.
Screenshot capture silently fails on any Tailwind v4 host page with stock
html2canvas.)

## Usage

```jsx
import { NotasWidget } from "./widget"; // or wherever you copied it to

export default function Layout({ children }) {
  return (
    <>
      {children}
      <NotasWidget sessionId={SESSION_ID} appName="Client Portal" />
    </>
  );
}
```

## Props

| Prop | Required | Default | What it does |
|---|---|---|---|
| `sessionId` | yes | — | Created from the Notas dashboard. Without it, the widget renders nothing (and logs a console warning). |
| `appName` | no | — | Shows up in the dashboard's item metadata so you know which client app a nota came from. |
| `lang` | no | `"en"` | Initial language. The widget has its own EN/ES toggle a tester can flip mid-session regardless of this. |
| `position` | no | `"bottom-right"` | Or `"bottom-left"`, for the trigger button's corner. |
| `onItemSaved` | no | — | Called with the saved item after each successful submit, if you want to react to it in the host app. |
| `renderTrigger` | no | `true` | Set `false` to hide the built-in floating trigger button and drive opening yourself (see Menu integration below). |
| `open` | no | — | Controlled open state. If provided, you own showing/hiding the widget instead of its internal state. |
| `onOpenChange` | no | — | Called with the new open value whenever the widget wants to open or close itself (submit success, backdrop click, X button). Required if you pass `open`. |

## Where the data goes

All copies of this widget — across every client project — report into the
**same** Notas Supabase backend (`supabaseClient.js` has the URL/key
baked in). That's intentional: one dashboard, one place to see feedback
from every client app, with sessions scoped by `sessionId`. Don't repoint
`supabaseClient.js` at a different Supabase project unless you actually
want a disconnected, separate Notas instance.

## Getting a sessionId

Sessions are created from `https://notas-app-fawn.vercel.app/dashboard`
("New session" → client name + app name → copy the session URL). The
`sessionId` is the value after `?session=` in that URL.

## Turning it off for a client

Close (or archive) the session from the dashboard. The widget checks its
session's status on load and stops rendering entirely for anything other
than "active" — no code change or redeploy needed in the client's project.
(It fails *open* on a network error, so a brief connectivity hiccup won't
take feedback capture down — only an explicit closed/archived/missing
session hides it.)

## Menu integration (persistent, on-demand access)

By default the widget shows its own floating trigger button. If you'd
rather a client access Notas from your app's own menu — so it's just
always there for them to use whenever, not a floating overlay — pass
`renderTrigger={false}` and drive it with `open`/`onOpenChange`:

```jsx
const [notasOpen, setNotasOpen] = useState(false);

<button onClick={() => setNotasOpen(true)}>Leave feedback</button>

<NotasWidget
  sessionId={SESSION_ID}
  renderTrigger={false}
  open={notasOpen}
  onOpenChange={setNotasOpen}
/>
```

Combined with the session-status gating above: leave the session "active"
indefinitely if you want this to be a permanent menu item the client can
use anytime, or close the session whenever you want to retire it.

## Non-React projects

If the client project isn't React at all, don't copy this folder —
use the vanilla embed script instead:

```html
<script src="https://notas-app-fawn.vercel.app/embed/notas.js"></script>
<script>
  Notas.init({ sessionId: "...", appName: "..." });
</script>
```

That script is built from this same `widget/` folder (see
`../../embed/mount.js` and `../../vite.embed.config.js` in the main repo),
so both paths stay in sync automatically whenever this folder is updated
and redeployed.
