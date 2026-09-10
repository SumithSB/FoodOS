// Manufacturer-reply store helpers (app layer, not the engine).
// Replies are keyed by brand + ingredient id. Before classifying, the app
// checks this store and passes the saved source as a status override into
// the engine, so a previously-answered UNDETERMINED does not ask again.
// plant-derived -> always_plant, animal-derived -> always_animal (each
// profile then decides reject / undetermined / allowed as usual).

import type { IngredientStatus } from '../engine/types.ts'
import { getAllReplies, putReply } from './cache.ts'

export type ReplySource = 'plant' | 'animal' | 'unclear'

export function replyKey(brand: string, ingredientId: string): string {
  return `${brand.trim().toLowerCase()}::${ingredientId.trim().toLowerCase()}`
}

const SOURCE_STATUS: Record<Exclude<ReplySource, 'unclear'>, IngredientStatus> = {
  plant: 'always_plant',
  animal: 'always_animal',
}

/**
 * Build engine status overrides from saved replies for one brand.
 * Tokens carry ruleId from the engine's resolveTokens step; only tokens
 * whose rule has a saved reply for this brand are overridden.
 */
export async function replyStatusOverrides(
  brand: string | null,
  tokens: Array<{ normalised: string; ruleId: string | null }>,
): Promise<Record<string, IngredientStatus>> {
  if (!brand) return {}
  const replies = await getAllReplies().catch(() => [])
  const wantedBrand = brand.trim().toLowerCase()
  const overrides: Record<string, IngredientStatus> = {}
  for (const token of tokens) {
    if (!token.ruleId || token.ruleId.startsWith('reply:')) continue
    const reply = replies.find(
      (r) =>
        r.brand.trim().toLowerCase() === wantedBrand &&
        r.ingredientId.trim().toLowerCase() === token.ruleId?.toLowerCase(),
    )
    if (!reply || reply.resolution === 'unclear') continue
    overrides[token.normalised] =
      SOURCE_STATUS[reply.resolution as Exclude<ReplySource, 'unclear'>]
  }
  return overrides
}

export async function saveReply(input: {
  brand: string
  ingredientId: string
  resolution: ReplySource
  note: string
}): Promise<void> {
  await putReply({
    key: replyKey(input.brand, input.ingredientId),
    brand: input.brand.trim(),
    ingredientId: input.ingredientId.trim(),
    resolution: input.resolution,
    note: input.note.trim(),
    updatedAt: Date.now(),
  })
}
