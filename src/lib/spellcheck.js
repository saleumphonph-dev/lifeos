// Always-on, offline spell-checker for the journal editor.
//
// Uses a bundled Hunspell dictionary (vendored from `dictionary-en`) + nspell.
// This whole module is meant to be loaded lazily (dynamic import) so the
// ~540KB dictionary never lands in the initial bundle.
//
// Highlighting is done with the CSS Custom Highlight API, which marks ranges
// WITHOUT mutating the editable DOM — so the caret, undo stack, and @-mention
// chips are never disturbed. Browsers without the API simply get no overlay
// (the caller falls back to native spellcheck).

import nspell from 'nspell'
import aff from './dict/en.aff?raw'
import dic from './dict/en.dic?raw'

const CUSTOM_KEY = 'spellcheck.custom.v1'

let speller = null
const ignored = new Set() // session-only "ignore once" words (lowercased)

/** Words the user has permanently added (venture names, etc.). */
export function loadCustomWords() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomWords(words) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(words))
  } catch {
    /* ignore quota errors */
  }
}

/** Build (once) and return the nspell instance with custom words applied. */
export function getSpeller() {
  if (!speller) {
    speller = nspell(aff, dic)
    for (const w of loadCustomWords()) {
      if (w) speller.add(w)
    }
  }
  return speller
}

export function isSupported() {
  return typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined'
}

/** Permanently teach the dictionary a word. */
export function addToDictionary(word) {
  const w = word.trim()
  if (!w) return
  const words = loadCustomWords()
  if (!words.includes(w)) {
    words.push(w)
    saveCustomWords(words)
  }
  getSpeller().add(w)
}

/** Ignore a word for this session only. */
export function ignoreWord(word) {
  ignored.add(word.toLowerCase())
}

// A word is anything alphabetic, allowing internal apostrophes (don't, it's).
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g

function isMisspelled(word) {
  if (word.length < 2) return false
  if (ignored.has(word.toLowerCase())) return false
  // Skip ALL-CAPS acronyms and things with digits — too noisy otherwise.
  if (/^[A-Z]{2,}$/.test(word)) return false
  return !getSpeller().correct(word)
}

/**
 * Scan the editor's text nodes and paint a red wavy underline under every
 * misspelled word via CSS.highlights. Skips text inside @-mention chips.
 * Returns the count of misspellings found.
 */
export function highlightEditor(editorEl) {
  if (!isSupported() || !editorEl) return 0
  const sp = getSpeller()
  const ranges = []

  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT
      if (node.parentElement && node.parentElement.closest('.mention')) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let node
  while ((node = walker.nextNode())) {
    const text = node.textContent
    let m
    WORD_RE.lastIndex = 0
    while ((m = WORD_RE.exec(text))) {
      const word = m[0]
      if (word.length < 2 || sp.correct(word)) continue
      if (!isMisspelled(word)) continue
      const range = document.createRange()
      range.setStart(node, m.index)
      range.setEnd(node, m.index + word.length)
      ranges.push(range)
    }
  }

  if (ranges.length === 0) {
    CSS.highlights.delete('misspelled')
  } else {
    CSS.highlights.set('misspelled', new Highlight(...ranges))
  }
  return ranges.length
}

export function clearHighlights() {
  if (isSupported()) CSS.highlights.delete('misspelled')
}

/** Find the misspelled word (if any) at a viewport point — for right-click. */
export function wordAtPoint(editorEl, x, y) {
  let node, offset
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y)
    if (!r) return null
    node = r.startContainer
    offset = r.startOffset
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y)
    if (!pos) return null
    node = pos.offsetNode
    offset = pos.offset
  } else {
    return null
  }

  if (node.nodeType !== Node.TEXT_NODE) return null
  if (!editorEl.contains(node)) return null
  if (node.parentElement && node.parentElement.closest('.mention')) return null

  const text = node.textContent
  // Expand left/right to word boundaries around the caret offset.
  let start = offset
  let end = offset
  const isWord = (c) => /[A-Za-z'’]/.test(c)
  while (start > 0 && isWord(text[start - 1])) start--
  while (end < text.length && isWord(text[end])) end++
  const word = text.slice(start, end)
  if (!word || !isMisspelled(word)) return null

  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  return { word, node, start, end, range, suggestions: getSpeller().suggest(word).slice(0, 6) }
}
