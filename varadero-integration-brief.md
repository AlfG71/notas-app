# Integrating Notas into Varadero App

Paste this whole message into a new chat scoped to the Varadero App project.

## What this is

Notas is a bilingual (EN/ES) in-app feedback/bug-reporting widget I built
as a standalone tool (GonzalezTech / `notas-app-fawn.vercel.app`). It lets
a client leave a nota (bug/feedback/idea) with an annotated screenshot,
right inside whatever app it's embedded in, saved straight to my Notas
Supabase backend and visible in my Notas dashboard.

I want to embed it in Varadero App so the client can use it during our
next meeting (and potentially keep using it afterward — see the "how long
should this stay on" note below).

## What needs to happen

1. **Copy the widget folder — directly, not by pasting.** The source is
   the `src/widget/` folder in my Notas repo, which is fully
   self-contained (only imports from siblings inside itself, plus `react`,
   `react-dom`, and `html2canvas` — nothing else from the Notas repo is
   needed). Do this:

   a. Connect to the Notas repo folder so you can read from it directly:
      call `request_cowork_directory` with path
      `~/Dev/Freelance/GonzalezTech/03_Tools/BugReportingApp`.

   b. Connect to this Varadero App project's folder the same way (ask me
      for the path, or use the folder picker, if it's not already
      connected in this session).

   c. Copy the folder over with a shell command rather than retyping file
      contents — e.g. (adjust the destination to wherever this project's
      convention is, such as `src/widget/` or `components/notas-widget/`):
      ```
      cp -r <notas-repo-path>/src/widget <varadero-project-path>/src/widget
      ```
      Then read a file or two back to confirm the copy landed intact
      before moving on.

   Do not recreate these files from memory or by summarizing — copy them
   byte-for-byte so nothing drifts from the tested original.

2. **Install the one new dependency:**
   ```
   npm install html2canvas-pro
   ```
   (react/react-dom are already in the project. Use the "-pro" fork, not
   stock `html2canvas` — stock html2canvas can't parse `oklch()`/`oklab()`
   colors, which Tailwind v4 emits by default, and screenshot capture
   silently fails as a result.)

3. **Get a sessionId.** I'll create a session from
   `https://notas-app-fawn.vercel.app/dashboard` → "New session" → client
   name "Varadero" (or whatever) + app name "Varadero App". That gives me
   a session URL like `notas-app-fawn.vercel.app?session=<uuid>` — the
   `<uuid>` part is the `sessionId` to use below.

4. **Mount the widget.** Somewhere near the root of the app (a layout
   component that wraps every page is ideal, so it's available app-wide):

   ```jsx
   import { NotasWidget } from "./widget"; // adjust path to wherever it landed

   <NotasWidget sessionId="PASTE_THE_UUID_HERE" appName="Varadero App" />
   ```

   That's it for the simplest version — this renders a floating "Leave a
   Nota" trigger button in the bottom-right corner, in any page it's
   mounted on.

## Decision needed: floating button vs. menu item

Two ways this can show up in Varadero App — I haven't decided which I want
yet, so raise this with me if it's not obvious from context:

**Option A — floating button (default, zero extra work).** Just the
snippet above. A "Leave a Nota" button floats in the corner everywhere the
component is mounted.

**Option B — Varadero's own menu item.** If Varadero already has a nav
menu and I'd rather Notas show up as a normal menu item ("Feedback" /
"Report an issue") instead of a floating overlay, use the controlled mode:

```jsx
const [notasOpen, setNotasOpen] = useState(false);

// wherever the menu items are:
<button onClick={() => setNotasOpen(true)}>Feedback</button>

// mounted once, e.g. in the root layout:
<NotasWidget
  sessionId="PASTE_THE_UUID_HERE"
  appName="Varadero App"
  renderTrigger={false}
  open={notasOpen}
  onOpenChange={setNotasOpen}
/>
```

## How long should this stay on?

This is controlled entirely from the Notas dashboard, not from Varadero's
code — closing (or archiving) the session makes the widget stop rendering
on its *next load*, automatically, no redeploy of Varadero App needed.
So:

- For a one-time client testing session: close the session from the
  dashboard right after the meeting, and it turns itself off in Varadero
  App without touching this repo again.
- For an ongoing "always available to the client" feature (e.g. Option B
  above, as a permanent menu item): just leave the session active
  indefinitely.

## Where the data ends up

Whatever the client submits shows up in the same Notas dashboard as
everything else I've tested — filterable/scoped by this session. Nothing
client-specific needs to be set up on the backend beyond creating that one
session.
