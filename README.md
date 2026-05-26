# LifeOS

A premium personal productivity operating system — built in React + Vite + Tailwind.

Eight modules: Dashboard · Projects · Focus · Analytics · Journal · Goals · Habits · AI.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Build

```bash
npm run build      # production bundle in dist/
npm run preview    # preview the built bundle
```

## Stack

- Vite 5 + React 18 (JS, not TS)
- React Router v6
- Tailwind CSS — design tokens in [tailwind.config.js](tailwind.config.js)
- `@dnd-kit` — drag-and-drop Kanban
- `recharts` — line / area / bar / pie / heatmap
- `framer-motion` — view transitions, command palette, modal
- `lucide-react` — icons
- LocalStorage — persistence (no backend yet)

## Keyboard shortcuts

| Key       | Action                          |
| --------- | ------------------------------- |
| `⌘K / ⌃K` | Open command palette            |
| `N`       | New task modal                  |
| `1`–`8`   | Switch to Dashboard…AI tab      |
| `Space`   | Pause/resume in Focus mode      |
| `Esc`     | Exit Focus mode / close palette |

## Layout

- **Desktop (≥1280px):** 220px sidebar + flex main; Dashboard has an inline right rail.
- **Tablet (768–1280px):** sidebar collapses below `lg`, main fills width.
- **Mobile (<768px):** hidden sidebar, fixed bottom tab bar with center FAB.
- **Focus mode** overrides the shell for an immersive, full-bleed experience.

## Data shapes

See [src/lib/mockData.js](src/lib/mockData.js) — `Task`, `Project`, `JournalEntry`, `FocusSession`, `Goal`, `Habit`.

State lives in [src/state/AppState.jsx](src/state/AppState.jsx) and auto-persists to `localStorage` under the `lifeos.state.v1` key.

To wipe local data: `localStorage.removeItem('lifeos.state.v1')` in DevTools console.

## File tree

```
src/
├── App.jsx
├── main.jsx
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx        # shell, shortcuts, view transitions
│   │   ├── Sidebar.jsx         # desktop nav
│   │   ├── Topbar.jsx          # title, ⌘K, new
│   │   ├── MobileTabBar.jsx    # mobile bottom nav + FAB
│   │   ├── CommandPalette.jsx  # ⌘K search
│   │   └── NewTaskModal.jsx    # N shortcut
│   └── ui/
│       ├── Card.jsx
│       ├── Button.jsx
│       ├── Badge.jsx
│       ├── ProgressRing.jsx
│       └── StatTile.jsx
├── views/
│   ├── Dashboard.jsx
│   ├── Projects.jsx            # Kanban + ICE × Priority matrix
│   ├── Focus.jsx               # full-screen Pomodoro
│   ├── Analytics.jsx           # heatmap + charts
│   ├── Journal.jsx             # contenteditable, auto-save, mood, energy
│   ├── Goals.jsx               # horizon timeline + progress
│   ├── Habits.jsx              # 30-day grid, streaks
│   └── AIAssistant.jsx         # mock chat + data-driven insights
├── state/AppState.jsx
├── lib/
│   ├── mockData.js
│   ├── storage.js
│   └── utils.js
└── styles/globals.css
```

## User context

The app ships with mock data for Saleumphon's projects:
LANI Jewelry · Liepngarm Clothing · Investment Firm · Prime Visa & Translation · Café Expansion · Real Estate Pitch Deck · UN ADCO Application.

Currency display: LAK (₭).
