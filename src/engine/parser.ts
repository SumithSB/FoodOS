// Pure ingredient-string parser: raw label text -> normalised tokens.
// No React, no fetch, no browser APIs. Runs unchanged in Node.

import type { Token } from './types.ts'

/** Normalise one ingredient phrase for knowledge-base lookup. */
export function normaliseToken(input: string): string {
  let s = input.toLowerCase()
  // Unicode dashes -> hyphen, then hyphens/slashes/underscores -> space.
  s = s.replace(/[‐‑‒–—―−]/g, '-')
  // Percentages carry no identity: "cocoa mass 50%" -> "cocoa mass".
  s = s.replace(/\d+([.,]\d+)?\s*%/g, ' ')
  // Canonical E-number form: "E 471", "E-471", "E472 A" -> "e471", "e472a".
  s = s.replace(/\be[\s-]*(\d+)\s*([a-z])?/g, 'e$1$2')
  s = s.replace(/[-_/]+/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  // Strip wrapping quotes/brackets and trailing label punctuation.
  s = s.replace(/^["'“”‘’([]+|["'“”‘’)\].,;:]+$/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

const LABEL_PREFIX = /^\s*(ingredients|ingrédients|zutaten|ingredienten)\s*[:\-–—]?\s*/i

function stripLabelPrefix(raw: string): string {
  return raw.replace(LABEL_PREFIX, '')
}

/** Split on separators that are not inside parentheses. */
function splitTopLevel(segment: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of segment) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if ((ch === ',' || ch === ';' || ch === '\n') && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

function parentheticalGroups(segment: string): string[] {
  const groups: string[] = []
  const stack: number[] = []
  for (let i = 0; i < segment.length; i += 1) {
    if (segment[i] === '(') stack.push(i)
    else if (segment[i] === ')' && stack.length > 0) {
      const start = stack.pop() as number
      groups.push(segment.slice(start + 1, i))
    }
  }
  return groups
}

/**
 * Split a raw ingredient string into flat segments.
 * Parenthetical sub-ingredients are emitted as their own segments
 * ("chocolate (cocoa mass, cocoa butter)" also yields "cocoa mass"
 * and "cocoa butter"), because the sub-ingredient is what matters.
 */
export function splitIngredientList(raw: string): string[] {
  const text = stripLabelPrefix(raw)
  const segments: string[] = []
  const visit = (chunk: string): void => {
    for (const part of splitTopLevel(chunk)) {
      const trimmed = part.trim()
      if (!trimmed) continue
      for (const group of parentheticalGroups(trimmed)) visit(group)
      const outer = trimmed.replace(/\([^()]*\)/g, ' ').replace(/\s+/g, ' ').trim()
      if (outer) segments.push(outer)
    }
  }
  visit(text)
  return segments.filter((s) => normaliseToken(s).length > 0)
}

/** Raw ingredient string -> normalised tokens (rule matching happens later). */
export function parseIngredientList(raw: string): Token[] {
  if (!raw || raw.trim().length === 0) return []
  return splitIngredientList(raw).map((segment) => ({
    raw: segment,
    normalised: normaliseToken(segment),
    ruleId: null,
    status: null,
  }))
}
