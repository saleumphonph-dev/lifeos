# LifeOS — Setup Guide

## You do NOT need to create any new folders on your Mac.
Everything lives inside `personal-dashboard/`. That's it.

---

## Step 1 — Run locally right now (no database needed)

```bash
cd ~/Desktop/personal-dashboard
npm run dev
```

Open http://localhost:5173 — the app works fully offline with LocalStorage.
You can use it indefinitely without doing Steps 2–4.

---

## Step 2 — Create Supabase database (free, 5 min)

1. Go to https://supabase.com and sign up (free)
2. Click **New project**
   - Name: `lifeos`
   - DB password: (save this somewhere safe)
   - Region: Southeast Asia (Singapore) — closest to Vientiane
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** → **New query**
5. Paste the entire contents of `supabase/schema.sql` and click **Run**
6. Go to **Project Settings → API**
7. Copy:
   - **Project URL** → looks like `https://abcdef.supabase.co`
   - **anon public** key → long string starting with `eyJ...`

8. Create a file called `.env.local` in `personal-dashboard/`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key...
VITE_ALLOWED_EMAIL=your.email@example.com
```

9. Restart the dev server: `npm run dev`

**Auth setup:**
- Go to Supabase → **Authentication → Email** → make sure "Enable Email Confirmations" is OFF (magic links only)
- Go to **Authentication → URL Configuration** → add your Vercel URL (after Step 4) to the redirect URLs

---

## Step 3 — Deploy to Vercel (free, 5 min)

### Option A: Drag & drop (easiest)

1. Build the app: `npm run build` (creates a `dist/` folder)
2. Go to https://vercel.com → sign up with GitHub
3. Click **Add New → Project** → **Deploy from folder** or drag the `dist/` folder
4. Done — Vercel gives you a URL like `https://lifeos-abc.vercel.app`

### Option B: GitHub (recommended for auto-deploy)

1. Create a private GitHub repo at https://github.com/new
2. In your terminal:
```bash
cd ~/Desktop/personal-dashboard
git init
git add .
git commit -m "LifeOS initial"
git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
git push -u origin main
```
3. Go to https://vercel.com → **Add New → Project** → Import your GitHub repo
4. Vercel auto-detects Vite. Leave settings as-is, click **Deploy**
5. Go to **Project → Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_ALLOWED_EMAIL` = your email
6. Click **Redeploy** after adding env vars

---

## Step 4 — Add your Vercel URL to Supabase

1. Copy your Vercel URL (e.g. `https://lifeos-abc.vercel.app`)
2. Supabase → **Authentication → URL Configuration**
3. Add to **Redirect URLs**: `https://lifeos-abc.vercel.app/**`
4. Set **Site URL** to your Vercel URL

---

## How to sign in

1. Open the app (localhost or Vercel URL)
2. Enter your email → click "Send magic link"
3. Check your email → click the link
4. You're in — on both Mac and iPhone (same email)

---

## How sync works

| Situation | What happens |
|-----------|-------------|
| No Supabase configured | App runs fully on LocalStorage, no login needed |
| Supabase configured, offline | App uses LocalStorage, queues sync for when online |
| Supabase configured, online | Every change saves to LocalStorage instantly + pushes to Supabase every 3s |
| Open on iPhone | Sign in with same email → magic link → data pulled from Supabase |

---

## Folder structure (for reference)

```
personal-dashboard/
├── src/
│   ├── views/          ← Dashboard, Projects, Focus, Analytics, Journal, Goals, Habits, AI
│   ├── components/     ← UI components, layout (Sidebar, Topbar, etc.)
│   ├── state/          ← AppState (useReducer), AuthState
│   └── lib/            ← storage.js, sync.js, supabase.js, utils.js, mockData.js
├── supabase/
│   └── schema.sql      ← Paste this into Supabase SQL Editor
├── .env.local          ← YOU CREATE THIS (not in git)
├── .env.example        ← Template for .env.local
├── vercel.json         ← Vercel routing config (already done)
└── package.json
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `⌘K` | Open command palette / search |
| `N` | New task |
| `1–8` | Jump to view |
| `Space` | Pause/resume focus timer (in Focus mode) |
| `Esc` | Exit focus mode |
