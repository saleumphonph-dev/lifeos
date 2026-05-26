// Mock seed data for LifeOS — populates the app on first load.

export const PROJECTS = [
  {
    id: 'p-lani',
    name: 'LANI Jewelry',
    color: '#a78bfa',
    progress: 62,
    startDate: '2026-01-15',
    endDate: '2026-07-30',
    effort: { invested: 184, total: 320 },
    taskCount: { active: 8, done: 23 },
    healthScore: 86,
    status: 'on_track',
  },
  {
    id: 'p-liepngarm',
    name: 'Liepngarm Clothing',
    color: '#2ee5a6',
    progress: 41,
    startDate: '2026-02-01',
    endDate: '2026-09-15',
    effort: { invested: 96, total: 280 },
    taskCount: { active: 12, done: 14 },
    healthScore: 72,
    status: 'on_track',
  },
  {
    id: 'p-invest',
    name: 'Investment Firm',
    color: '#4a9eff',
    progress: 28,
    startDate: '2026-03-01',
    endDate: '2026-12-31',
    effort: { invested: 64, total: 480 },
    taskCount: { active: 6, done: 9 },
    healthScore: 91,
    status: 'on_track',
  },
  {
    id: 'p-prime',
    name: 'Prime Visa & Translation',
    color: '#ffb547',
    progress: 88,
    startDate: '2025-11-01',
    endDate: '2026-06-30',
    effort: { invested: 312, total: 360 },
    taskCount: { active: 3, done: 41 },
    healthScore: 94,
    status: 'on_track',
  },
  {
    id: 'p-cafe',
    name: 'Café Expansion',
    color: '#ff7eb3',
    progress: 18,
    startDate: '2026-04-10',
    endDate: '2026-11-30',
    effort: { invested: 32, total: 240 },
    taskCount: { active: 9, done: 4 },
    healthScore: 58,
    status: 'at_risk',
  },
  {
    id: 'p-realestate',
    name: 'Real Estate Pitch Deck',
    color: '#5eead4',
    progress: 55,
    startDate: '2026-04-20',
    endDate: '2026-06-15',
    effort: { invested: 38, total: 70 },
    taskCount: { active: 5, done: 7 },
    healthScore: 64,
    status: 'at_risk',
  },
  {
    id: 'p-undadco',
    name: 'UN ADCO Application',
    color: '#9ca3af',
    progress: 73,
    startDate: '2026-03-15',
    endDate: '2026-06-01',
    effort: { invested: 56, total: 80 },
    taskCount: { active: 4, done: 11 },
    healthScore: 81,
    status: 'on_track',
  },
]

export const TASKS = [
  {
    id: 't-1', title: 'Finalize LANI summer capsule lookbook', description: 'Coordinate photographer, stylist, and pieces selection.',
    priority: 'P0', status: 'in_progress', projectId: 'p-lani', iceScore: 8.4,
    estimatedHours: 6, actualHours: 3.5, dueDate: '2026-05-26', tags: ['design', 'urgent'],
  },
  {
    id: 't-2', title: 'Source new fabric suppliers in Bangkok', description: 'Identify 3 silk + 2 linen alternatives.',
    priority: 'P1', status: 'backlog', projectId: 'p-liepngarm', iceScore: 7.2,
    estimatedHours: 8, dueDate: '2026-06-04', tags: ['ops'],
  },
  {
    id: 't-3', title: 'Investment firm — Q2 portfolio review',
    priority: 'P0', status: 'in_progress', projectId: 'p-invest', iceScore: 9.1,
    estimatedHours: 5, actualHours: 2, dueDate: '2026-05-28', tags: ['finance'],
  },
  {
    id: 't-4', title: 'Submit UN ADCO supplementary documents',
    priority: 'P0', status: 'review', projectId: 'p-undadco', iceScore: 8.8,
    estimatedHours: 3, actualHours: 3.5, dueDate: '2026-05-24', tags: ['compliance'],
  },
  {
    id: 't-5', title: 'Café build-out — finalize lease terms',
    priority: 'P0', status: 'in_progress', projectId: 'p-cafe', iceScore: 7.9,
    estimatedHours: 4, actualHours: 1, dueDate: '2026-05-27', tags: ['legal', 'urgent'],
  },
  {
    id: 't-6', title: 'Real Estate deck — financials section',
    priority: 'P1', status: 'in_progress', projectId: 'p-realestate', iceScore: 7.6,
    estimatedHours: 5, actualHours: 2.5, dueDate: '2026-05-30', tags: ['deck'],
  },
  {
    id: 't-7', title: 'Translate corporate brochure (FR → LA)',
    priority: 'P2', status: 'done', projectId: 'p-prime', iceScore: 6.4,
    estimatedHours: 2, actualHours: 1.8, completedAt: '2026-05-19', tags: ['translation'],
  },
  {
    id: 't-8', title: 'Photography mood board v2',
    priority: 'P2', status: 'review', projectId: 'p-lani', iceScore: 6.1,
    estimatedHours: 3, actualHours: 2.8, tags: ['design'],
  },
  {
    id: 't-9', title: 'Hire production assistant for Liepngarm',
    priority: 'P1', status: 'backlog', projectId: 'p-liepngarm', iceScore: 7.0,
    estimatedHours: 6, dueDate: '2026-06-10', tags: ['hiring'],
  },
  {
    id: 't-10', title: 'Café concept naming workshop',
    priority: 'P2', status: 'backlog', projectId: 'p-cafe', iceScore: 5.5,
    estimatedHours: 2, dueDate: '2026-06-08', tags: ['brand'],
  },
  {
    id: 't-11', title: 'Investment thesis — Lao SME sector memo',
    priority: 'P1', status: 'in_progress', projectId: 'p-invest', iceScore: 8.0,
    estimatedHours: 6, actualHours: 1.5, dueDate: '2026-06-05', tags: ['research'],
  },
  {
    id: 't-12', title: 'LANI Vientiane pop-up: vendor contracts',
    priority: 'P1', status: 'review', projectId: 'p-lani', iceScore: 7.3,
    estimatedHours: 4, actualHours: 3.5, dueDate: '2026-05-29', tags: ['ops'],
  },
  {
    id: 't-13', title: 'Real estate — investor list outreach',
    priority: 'P2', status: 'backlog', projectId: 'p-realestate', iceScore: 6.8,
    estimatedHours: 5, dueDate: '2026-06-12', tags: ['sales'],
  },
  {
    id: 't-14', title: 'Prime Visa — onboard 2 new translators',
    priority: 'P2', status: 'done', projectId: 'p-prime', iceScore: 5.2,
    estimatedHours: 3, actualHours: 3, completedAt: '2026-05-17', tags: ['hiring'],
  },
  {
    id: 't-15', title: 'Update LANI e-commerce checkout flow',
    priority: 'P3', status: 'backlog', projectId: 'p-lani', iceScore: 4.6,
    estimatedHours: 8, tags: ['eng'],
  },
]

export const GOALS = [
  {
    id: 'g-1', name: 'Build LANI to ₭1.2B annual revenue', type: 'annual',
    progress: 38, targetDate: '2026-12-31', linkedProjectIds: ['p-lani'], status: 'on_track',
  },
  {
    id: 'g-2', name: 'Launch Liepngarm flagship store', type: 'quarterly',
    progress: 41, targetDate: '2026-09-30', linkedProjectIds: ['p-liepngarm'], status: 'on_track',
  },
  {
    id: 'g-3', name: 'Close UN ADCO contract', type: 'quarterly',
    progress: 73, targetDate: '2026-06-30', linkedProjectIds: ['p-undadco'], status: 'ahead',
  },
  {
    id: 'g-4', name: 'Open café flagship in Vientiane', type: 'annual',
    progress: 18, targetDate: '2026-11-30', linkedProjectIds: ['p-cafe'], status: 'behind',
  },
  {
    id: 'g-5', name: 'Investment firm — first capital deployment', type: 'quarterly',
    progress: 28, targetDate: '2026-08-31', linkedProjectIds: ['p-invest'], status: 'on_track',
  },
  {
    id: 'g-6', name: 'Personal: read 24 books this year', type: 'annual',
    progress: 42, targetDate: '2026-12-31', linkedProjectIds: [], status: 'on_track',
  },
  {
    id: 'g-7', name: 'Weekly deep-work: 25 hrs', type: 'weekly',
    progress: 68, targetDate: '2026-05-25', linkedProjectIds: [], status: 'on_track',
  },
]

export const HABITS = [
  { id: 'h-1', name: 'Morning workout', icon: 'Dumbbell', color: '#ff5e5e', streak: 14, completedDates: lastNDates(28, 0.78), frequency: 'daily', target: 1 },
  { id: 'h-2', name: 'Read 30 min', icon: 'BookOpen', color: '#4a9eff', streak: 22, completedDates: lastNDates(28, 0.85), frequency: 'daily', target: 1 },
  { id: 'h-3', name: 'Meditation', icon: 'Sparkles', color: '#a78bfa', streak: 9, completedDates: lastNDates(28, 0.71), frequency: 'daily', target: 1 },
  { id: 'h-4', name: 'Lao language study', icon: 'Languages', color: '#ffb547', streak: 5, completedDates: lastNDates(28, 0.62), frequency: 'daily', target: 1 },
  { id: 'h-5', name: 'Weekly review', icon: 'Compass', color: '#2ee5a6', streak: 7, completedDates: lastNDates(28, 0.96, true), frequency: 'weekly', target: 1 },
]

export const JOURNAL_ENTRIES = [
  {
    id: 'j-1', date: '2026-05-22',
    mood: 'good', energy: 7,
    body: '<p>Solid morning of deep work on the LANI lookbook concept. Photographer confirmed. Started doubting the café timeline again — Q3 might be too aggressive given supplier delays.</p><p>Investment firm conversation with Khampheng went well — he\'s in for a follow-up next week.</p>',
    wins: ['LANI lookbook concept signed off', 'Closed 2 Prime Visa contracts'],
    misses: ['Skipped morning meditation', 'Café decision still pending'],
    lessons: ['Front-load creative work before email triage'],
    decisions: [
      { text: 'Push Café opening to Q4 2026', status: 'review', reviewDate: '2026-05-29' },
      { text: 'Hire fractional CFO for investment firm', status: 'pending' },
    ],
  },
  {
    id: 'j-2', date: '2026-05-21',
    mood: 'flow', energy: 9,
    body: '<p>3 hours uninterrupted on the Real Estate deck. Got the financial model into a defensible state.</p>',
    wins: ['Deck financials defensible', 'Workout streak +1'],
    misses: [],
    lessons: ['Block 6–9am every Tuesday for the deck.'],
    decisions: [],
  },
  {
    id: 'j-3', date: '2026-05-20',
    mood: 'okay', energy: 5,
    body: '<p>Heavy admin day. UN ADCO documents took longer than expected. Need to delegate this kind of thing.</p>',
    wins: ['UN ADCO submitted'],
    misses: ['No deep work blocks'],
    lessons: ['Group admin into a single 2-hr block, not scattered.'],
    decisions: [{ text: 'Hire an EA part-time', status: 'pending' }],
  },
]

export const FOCUS_SESSIONS = lastNFocusSessions(45)

// Helpers
function lastNDates(n, completionRate, weekly = false) {
  const out = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (weekly && d.getDay() !== 1) continue
    if (Math.random() < completionRate) out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function lastNFocusSessions(n) {
  const out = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - Math.floor(i / 2))
    const projectId = PROJECTS[Math.floor(Math.random() * PROJECTS.length)].id
    out.push({
      id: 'f-' + i,
      taskId: 't-' + (1 + Math.floor(Math.random() * 15)),
      projectId,
      duration: 25 + Math.floor(Math.random() * 60),
      startedAt: d.toISOString(),
      completedAt: new Date(d.getTime() + 25 * 60_000).toISOString(),
      cyclesPlanned: 4,
      cyclesCompleted: 3 + Math.floor(Math.random() * 2),
      qualityScore: 6.5 + Math.random() * 3,
      distractionsBlocked: Math.floor(Math.random() * 8),
    })
  }
  return out
}

export const USER = {
  name: 'Saleumphon',
  shortName: 'Sa',
  location: 'Vientiane, Laos',
  timezone: 'Asia/Vientiane',
  currency: 'LAK',
}
