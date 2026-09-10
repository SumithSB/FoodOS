// Headless eval harness. Runs in Node (tsx), imports src/engine directly.
// Prints Total / Correct / Wrong (non-critical) / FALSE SAFE (critical) /
// Undetermined rate. Exit code 1 if FALSE SAFE > 0 — that is the only gate.
// Eval runs only against strict_indian_vegetarian (other profiles are
// unvalidated by design). Fixture `expected` values must be human-authored;
// fixtures with a null expected are reported as unlabelled, never graded.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { classifyIngredientList } from '../src/engine/classifier.ts'
import type { IngredientRule, ProfileRule, VerdictKind } from '../src/engine/types.ts'

interface Fixture {
  name: string
  barcode: string | null
  ingredients: string
  profile: string
  expected: VerdictKind | null
  note: string
}

const EVAL_PROFILE = 'strict_indian_vegetarian'

const root = dirname(fileURLToPath(import.meta.url))
const repo = join(root, '..')
const rules = load(
  readFileSync(join(repo, 'src', 'engine', 'rules', 'ingredients.yaml'), 'utf8'),
) as IngredientRule[]
const profiles = load(
  readFileSync(join(repo, 'src', 'engine', 'rules', 'profiles.yaml'), 'utf8'),
) as ProfileRule[]
const fixtures = load(readFileSync(join(root, 'fixtures.yaml'), 'utf8')) as Fixture[]

const profile = profiles.find((p) => p.id === EVAL_PROFILE)
if (!profile) {
  console.error(`Eval profile missing from profiles.yaml: ${EVAL_PROFILE}`)
  process.exit(2)
}

let labelled = 0
let correct = 0
let wrongNonCritical = 0
let falseSafe = 0
let undetermined = 0
let classified = 0
const failures: string[] = []

for (const fixture of fixtures) {
  const verdict = classifyIngredientList(fixture.ingredients ?? '', profile, rules)
  classified += 1
  if (verdict.kind === 'UNDETERMINED') undetermined += 1
  if (fixture.expected === null || fixture.expected === undefined) continue
  labelled += 1
  if (verdict.kind === fixture.expected) {
    correct += 1
    continue
  }
  if (verdict.kind === 'SAFE') {
    falseSafe += 1
    failures.push(
      `FALSE SAFE: "${fixture.name}" expected ${fixture.expected}, got SAFE. Why: ${fixture.note}`,
    )
  } else {
    wrongNonCritical += 1
    failures.push(
      `wrong (non-critical): "${fixture.name}" expected ${fixture.expected}, got ${verdict.kind}. Why: ${fixture.note}`,
    )
  }
}

console.log(`Profile: ${EVAL_PROFILE}`)
console.log(`Classified: ${classified} / Labelled: ${labelled} / Unlabelled placeholders: ${classified - labelled}`)
console.log(
  `Total ${labelled} / Correct ${correct} / Wrong (non-critical) ${wrongNonCritical} / FALSE SAFE (critical) ${falseSafe} / Undetermined rate ${(classified === 0 ? 0 : undetermined / classified).toFixed(2)}`,
)
for (const failure of failures) console.log(failure)

if (labelled === 0) {
  console.log('No human-labelled fixtures yet; add expected values to eval/fixtures.yaml.')
}
process.exit(falseSafe > 0 ? 1 : 0)
