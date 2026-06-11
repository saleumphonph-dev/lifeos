import { useState } from 'react'
import { Heart, Sparkles, Globe, Coins, X, Users, ArrowUpRight, Crown, TrendingDown, Check, Plus } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { useApp, defaultIdentity } from '../state/AppState'
import { cn, uid } from '../lib/utils'

// Classic Ikigai Venn: four overlapping circles in a diamond. Screen blend
// brightens the overlaps so the lens regions read clearly on the dark bg.
function IkigaiVenn() {
  const circles = [
    { cx: 200, cy: 132, color: '#ff7eb3' }, // top — LOVE
    { cx: 132, cy: 200, color: '#4a9eff' }, // left — GOOD AT
    { cx: 268, cy: 200, color: '#2ee5a6' }, // right — WORLD NEEDS
    { cx: 200, cy: 268, color: '#ffb547' }, // bottom — PAID FOR
  ]
  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[420px] mx-auto block" role="img" aria-label="Ikigai diagram">
      <g style={{ mixBlendMode: 'screen' }}>
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r="118" fill={c.color} fillOpacity="0.18" stroke={c.color} strokeOpacity="0.5" strokeWidth="1" />
        ))}
      </g>
      {/* Main circle labels (outer caps) */}
      <g fontFamily="inherit" textAnchor="middle" fill="#f5f5f7" fontWeight="600">
        <text x="200" y="44" fontSize="14">LOVE</text>
        <text x="200" y="50" fontSize="9" fill="#ff7eb3" dy="12">what you love</text>
        <text x="64" y="198" fontSize="14">GOOD AT</text>
        <text x="64" y="204" fontSize="9" fill="#4a9eff" dy="12">what you're good at</text>
        <text x="336" y="198" fontSize="14">NEEDS</text>
        <text x="336" y="204" fontSize="9" fill="#2ee5a6" dy="12">what the world needs</text>
        <text x="200" y="366" fontSize="14">PAID FOR</text>
        <text x="200" y="372" fontSize="9" fill="#ffb547" dy="12">what you're paid for</text>
      </g>
      {/* Overlap (lens) labels */}
      <g fontFamily="inherit" textAnchor="middle" fill="#e9e9ee" fontSize="9" letterSpacing="0.5">
        <text x="150" y="158">PASSION</text>
        <text x="250" y="158">MISSION</text>
        <text x="150" y="248">PROFESSION</text>
        <text x="250" y="248">VOCATION</text>
      </g>
      {/* Center */}
      <text x="200" y="204" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" letterSpacing="1">IKIGAI</text>
    </svg>
  )
}

const IKIGAI = [
  { key: 'love',       label: 'What I love',          hint: 'Energizes you, you lose time doing it', icon: Heart,    color: '#ff7eb3' },
  { key: 'goodAt',     label: "What I'm good at",      hint: 'Your strengths, skills, talents',       icon: Sparkles, color: '#4a9eff' },
  { key: 'worldNeeds', label: 'What the world needs',  hint: 'The problem you help solve',            icon: Globe,    color: '#2ee5a6' },
  { key: 'paidFor',    label: 'What I can be paid for',hint: 'What people will pay you to do',         icon: Coins,    color: '#ffb547' },
]

function worthVibe(v) {
  if (v < 30) return { label: 'Be gentle with yourself today.', color: '#ff5e5e' }
  if (v < 55) return { label: 'Finding your footing. Keep going.', color: '#ffb547' }
  if (v < 80) return { label: "Steady — you're doing the work.", color: '#4a9eff' }
  if (v < 95) return { label: 'Strong. Own it.', color: '#2ee5a6' }
  return { label: 'Unshakeable.', color: '#a78bfa' }
}

export default function Identity() {
  const { state, dispatch } = useApp()
  const identity = state.identity || defaultIdentity()
  const [newHat, setNewHat] = useState('')

  const update = (patch) => dispatch({ type: 'identity.update', patch })
  const setIkigai = (key, value) => update({ ikigai: { ...identity.ikigai, [key]: value } })

  function addHat(e) {
    e.preventDefault()
    const label = newHat.trim()
    if (!label) return
    update({ hats: [...identity.hats, { id: uid(), label }] })
    setNewHat('')
  }
  function removeHat(id) {
    update({
      hats: identity.hats.filter(h => h.id !== id),
      activeHatId: identity.activeHatId === id ? null : identity.activeHatId,
    })
  }
  function setCircle(field, idx, key, value) {
    const arr = [...(identity[field] || [])]
    arr[idx] = { ...arr[idx], [key]: value }
    update({ [field]: arr })
  }

  const failurePaths = identity.failurePaths || defaultIdentity().failurePaths
  const [newFail, setNewFail] = useState('')
  const clearedCount = failurePaths.filter(f => f.clear).length
  function toggleFail(id) {
    update({ failurePaths: failurePaths.map(f => (f.id === id ? { ...f, clear: !f.clear } : f)) })
  }
  function addFail(e) {
    e.preventDefault()
    const text = newFail.trim()
    if (!text) return
    update({ failurePaths: [...failurePaths, { id: uid(), text, clear: false }] })
    setNewFail('')
  }
  function removeFail(id) {
    update({ failurePaths: failurePaths.filter(f => f.id !== id) })
  }

  const vibe = worthVibe(identity.selfWorth)
  const activeHat = identity.hats.find(h => h.id === identity.activeHatId)

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Header */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Reflection</div>
        <h1 className="font-display text-2xl text-text-primary mt-0.5">Who am I</h1>
        <p className="text-[13px] text-text-tertiary mt-1">A mirror to come back to. Nothing here is shared — it's yours.</p>
      </div>

      {/* The hat I'm wearing */}
      <Card>
        <CardHeader eyebrow="Right now" title="The hat I'm wearing" />
        <div className="flex flex-wrap gap-2">
          {identity.hats.map(h => (
            <span key={h.id} className="group relative">
              <button
                onClick={() => update({ activeHatId: identity.activeHatId === h.id ? null : h.id })}
                className={cn(
                  'h-9 pl-3 pr-7 rounded-full text-[13px] border transition-colors flex items-center gap-1.5',
                  identity.activeHatId === h.id
                    ? 'bg-accent-blue/15 border-accent-blue/40 text-text-primary'
                    : 'bg-white/[0.04] border-border-subtle text-text-secondary hover:bg-white/[0.07]'
                )}
              >
                {identity.activeHatId === h.id && <Crown size={12} className="text-accent-blue" />}
                {h.label}
              </button>
              <button
                onClick={() => removeHat(h.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-text-quaternary hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <form onSubmit={addHat} className="inline-flex">
            <input
              value={newHat}
              onChange={(e) => setNewHat(e.target.value)}
              placeholder="+ add a hat"
              spellCheck="true" autoCapitalize="words"
              className="h-9 px-3 rounded-full bg-transparent border border-dashed border-border-subtle text-[13px] text-text-secondary placeholder:text-text-quaternary outline-none focus:border-accent-blue/40 w-32"
            />
          </form>
        </div>
        <div className="mt-3 text-[12px] text-text-tertiary">
          {activeHat
            ? <>Operating as <span className="text-text-primary font-medium">{activeHat.label}</span> today. Let your choices match the hat.</>
            : 'Select the role you’re leading from right now.'}
        </div>
      </Card>

      {/* Ikigai */}
      <Card>
        <CardHeader eyebrow="Ikigai · 生き甲斐" title="My reason for being" />
        <IkigaiVenn />
        <div className="text-[11px] text-text-quaternary text-center -mt-1 mb-4">Where all four meet is your ikigai. Fill each below.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {IKIGAI.map(f => (
            <div key={f.key} className="rounded-md border border-border-subtle bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: `${f.color}22` }}>
                  <f.icon size={13} style={{ color: f.color }} />
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-text-primary leading-tight">{f.label}</div>
                  <div className="text-[10.5px] text-text-quaternary">{f.hint}</div>
                </div>
              </div>
              <textarea
                value={identity.ikigai[f.key]}
                onChange={(e) => setIkigai(f.key, e.target.value)}
                rows={3}
                placeholder="…"
                spellCheck="true" autoCapitalize="sentences"
                className="w-full resize-none bg-transparent text-[13px] text-text-secondary leading-[1.6] outline-none placeholder:text-text-quaternary"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-accent-purple/30 bg-accent-purple/[0.06] p-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-accent-purple font-medium mb-1.5">My ikigai — where they meet</div>
          <textarea
            value={identity.ikigai.statement}
            onChange={(e) => setIkigai('statement', e.target.value)}
            rows={2}
            placeholder="In one sentence: the work only you can do…"
            spellCheck="true" autoCapitalize="sentences"
            className="w-full resize-none bg-transparent text-[15px] text-text-primary leading-[1.5] outline-none placeholder:text-text-quaternary font-display"
          />
        </div>
      </Card>

      {/* Self-worth */}
      <Card>
        <CardHeader eyebrow="Self-worth" title="How worthy I feel today" />
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-mono tnum text-4xl" style={{ color: vibe.color }}>{identity.selfWorth}</span>
          <span className="text-text-quaternary text-sm">/ 100</span>
          <span className="ml-auto text-[13px]" style={{ color: vibe.color }}>{vibe.label}</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={identity.selfWorth}
          onChange={(e) => update({ selfWorth: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: vibe.color }}
        />
        <textarea
          value={identity.selfWorthNote}
          onChange={(e) => update({ selfWorthNote: e.target.value })}
          rows={2}
          placeholder="Why? What am I basing this on today — and is it true?"
          spellCheck="true" autoCapitalize="sentences"
          className="mt-3 w-full resize-none rounded-sm bg-white/[0.03] border border-border-subtle p-3 text-[13px] text-text-secondary leading-[1.6] outline-none focus:border-border placeholder:text-text-quaternary"
        />
      </Card>

      {/* The five & the five */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CircleCard
          icon={Users} accent="#4a9eff"
          eyebrow="The 5 now" title="Who surrounds me"
          subtitle="The people you spend the most time with — you become their average."
          field="circleNow" items={identity.circleNow}
          notePlaceholder="their influence on me"
          onChange={setCircle}
        />
        <CircleCard
          icon={ArrowUpRight} accent="#2ee5a6"
          eyebrow="The 5 ahead" title="Who I move toward"
          subtitle="People who pull you up — who you want to learn from and become like."
          field="circleAspire" items={identity.circleAspire}
          notePlaceholder="what they'd help me become"
          onChange={setCircle}
        />
      </div>

      {/* Road to failure — inversion */}
      <Card>
        <div className="flex items-start gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-[7px] bg-accent-red/15 flex items-center justify-center shrink-0">
            <TrendingDown size={14} className="text-accent-red" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">Invert, always invert</div>
            <div className="text-[15px] font-semibold text-text-primary leading-tight">The road to failure</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono tnum text-[15px] text-text-primary">{clearedCount}/{failurePaths.length}</div>
            <div className="text-[10px] text-text-quaternary">avoided</div>
          </div>
        </div>
        <p className="text-[12px] text-text-tertiary leading-snug mb-3">
          Munger's rule: figure out how you'd guarantee failure — then never do it. Steer clear of all of these and success largely takes care of itself.
        </p>
        <ul className="space-y-1.5">
          {failurePaths.map(f => (
            <li key={f.id} className="group flex items-center gap-2.5">
              <button
                onClick={() => toggleFail(f.id)}
                className={cn(
                  'w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors',
                  f.clear ? 'bg-accent-emerald/20 border-accent-emerald/50 text-accent-emerald' : 'border-border-subtle text-transparent hover:border-accent-emerald/40'
                )}
                title={f.clear ? 'Staying clear' : 'Mark as avoided'}
              >
                <Check size={12} strokeWidth={3} />
              </button>
              <span className={cn('flex-1 text-[13px] leading-[1.5]', f.clear ? 'text-text-tertiary line-through' : 'text-text-secondary')}>
                {f.text}
              </span>
              <button
                onClick={() => removeFail(f.id)}
                className="opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-accent-red transition-opacity shrink-0"
                title="Remove"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addFail} className="mt-3 flex items-center gap-2">
          <input
            value={newFail}
            onChange={(e) => setNewFail(e.target.value)}
            placeholder="Add a way you'd fail…"
            spellCheck="true" autoCapitalize="sentences"
            className="flex-1 h-9 px-3 rounded-sm bg-white/[0.03] border border-border-subtle text-[13px] text-text-primary outline-none focus:border-border placeholder:text-text-quaternary"
          />
          <button type="submit" className="w-9 h-9 rounded-sm border border-border-subtle bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-secondary shrink-0">
            <Plus size={14} />
          </button>
        </form>
        {clearedCount === failurePaths.length && failurePaths.length > 0 && (
          <div className="mt-3 text-[12px] text-accent-emerald flex items-center gap-1.5">
            <Check size={13} /> All clear. Keep it that way — that's the whole game.
          </div>
        )}
      </Card>
    </div>
  )
}

function CircleCard({ icon: Icon, accent, eyebrow, title, subtitle, field, items, notePlaceholder, onChange }) {
  const list = items && items.length ? items : Array.from({ length: 5 }, () => ({ name: '', note: '' }))
  return (
    <Card>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: `${accent}22` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary font-medium">{eyebrow}</div>
          <div className="text-[15px] font-semibold text-text-primary leading-tight">{title}</div>
          <div className="text-[11px] text-text-quaternary mt-0.5 leading-snug">{subtitle}</div>
        </div>
      </div>
      <ul className="space-y-2">
        {list.slice(0, 5).map((person, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span
              className="w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-mono shrink-0"
              style={{ borderColor: `${accent}55`, color: accent }}
            >{i + 1}</span>
            <input
              value={person?.name || ''}
              onChange={(e) => onChange(field, i, 'name', e.target.value)}
              placeholder="Name"
              spellCheck="false" autoCapitalize="words"
              className="w-[40%] h-9 px-2.5 rounded-sm bg-white/[0.03] border border-border-subtle text-[13px] text-text-primary outline-none focus:border-border placeholder:text-text-quaternary"
            />
            <input
              value={person?.note || ''}
              onChange={(e) => onChange(field, i, 'note', e.target.value)}
              placeholder={notePlaceholder}
              spellCheck="true" autoCapitalize="sentences"
              className="flex-1 h-9 px-2.5 rounded-sm bg-white/[0.03] border border-border-subtle text-[12.5px] text-text-secondary outline-none focus:border-border placeholder:text-text-quaternary"
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}
