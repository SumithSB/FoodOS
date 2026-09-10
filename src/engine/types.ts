// Pure types for the classification engine.
// This module has zero React, zero network calls, zero browser APIs.

export type VerdictKind = 'SAFE' | 'NOT_SAFE' | 'UNDETERMINED'

export type IngredientStatus =
  | 'always_animal'
  | 'always_plant'
  | 'ambiguous'
  | 'dairy'
  | 'egg'
  | 'fermented_dairy'
  | 'root_vegetable'
  | 'allium'

export interface IngredientRule {
  id: string
  names: string[]
  status: IngredientStatus
  reason: string
  source_url: string
}

export interface ProfileRule {
  id: string
  label: string
  validated: boolean
  reject: IngredientStatus[]
  undetermined: IngredientStatus[]
  /** Extra rule ids that reject under this profile (e.g. beef for no_beef). */
  reject_ids?: string[]
  /** Extra rule ids forced to undetermined under this profile. */
  undetermined_ids?: string[]
  note?: string
}

export interface Token {
  raw: string
  normalised: string
  ruleId: string | null
  status: IngredientStatus | null
}

export interface ReasonLink {
  token: string
  ruleId: string | null
  ruleName: string | null
  status: IngredientStatus | 'unknown' | 'no_data'
  reason: string
  source: string | null
}

export interface Verdict {
  kind: VerdictKind
  profile: string
  reasons: ReasonLink[]
  unknownTokens: string[]
}
