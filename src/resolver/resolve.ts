// Resolver client: called ONLY for tokens matching nothing in the
// knowledge base. Returns a candidate rule id, or null when unsure /
// offline. The proxy must never return a status, category, or verdict;
// this client additionally validates any returned id against the bundled
// rules and treats unknown ids as null. Results are cached in IndexedDB.

import { loadIngredientRules } from '../engine/loadRules.ts'
import { getCachedResolution, logUnresolved, putCachedResolution } from '../data/cache.ts'

let knownIds: Set<string> | null = null

function getKnownIds(): Set<string> {
  if (!knownIds) knownIds = new Set(loadIngredientRules().map((r) => r.id))
  return knownIds
}

export async function resolveToken(token: string): Promise<string | null> {
  const key = token.trim()
  if (!key) return null
  try {
    const cached = await getCachedResolution(key)
    if (cached && cached.ruleId && getKnownIds().has(cached.ruleId)) return cached.ruleId
    if (cached && cached.ruleId === null) return null
  } catch {
    // Cache unavailable — continue to the network attempt.
  }
  let ruleId: string | null = null
  try {
    const res = await fetch('/api/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: key, knownIds: [...getKnownIds()] }),
    })
    if (res.ok) {
      const data = (await res.json()) as { ruleId?: unknown }
      if (typeof data.ruleId === 'string' && getKnownIds().has(data.ruleId)) {
        ruleId = data.ruleId
      }
    }
  } catch {
    ruleId = null
  }
  try {
    await putCachedResolution(key, ruleId)
    if (ruleId === null) await logUnresolved(key)
  } catch {
    // Caching is best-effort.
  }
  return ruleId
}
