// App-side rules loader. The engine core stays IO-free: it receives
// already-parsed rules, so the same module runs unchanged in Node
// (where eval/run.ts loads the same YAML files with fs).

import ingredientsRaw from './rules/ingredients.yaml?raw'
import profilesRaw from './rules/profiles.yaml?raw'
import { load } from 'js-yaml'
import type { IngredientRule, ProfileRule } from './types.ts'

export function loadIngredientRules(): IngredientRule[] {
  return load(ingredientsRaw) as IngredientRule[]
}

export function loadProfiles(): ProfileRule[] {
  return load(profilesRaw) as ProfileRule[]
}

export function getProfile(profiles: ProfileRule[], id: string): ProfileRule {
  const found = profiles.find((p) => p.id === id)
  if (!found) throw new Error(`Unknown profile: ${id}`)
  return found
}
