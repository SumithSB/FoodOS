import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { load } from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { classifyIngredientList, classifyTokens } from './classifier.ts'
import { parseIngredientList } from './parser.ts'
import type { IngredientRule, ProfileRule } from './types.ts'

const dir = dirname(fileURLToPath(import.meta.url))
const rules = load(
  readFileSync(join(dir, 'rules', 'ingredients.yaml'), 'utf8'),
) as IngredientRule[]
const profiles = load(
  readFileSync(join(dir, 'rules', 'profiles.yaml'), 'utf8'),
) as ProfileRule[]

function profile(id: string): ProfileRule {
  const found = profiles.find((p) => p.id === id)
  if (!found) throw new Error(`Missing profile in test: ${id}`)
  return found
}

const siv = () => profile('strict_indian_vegetarian')

describe('knowledge base integrity', () => {
  it('has unique ids and valid statuses with reasons and sources', () => {
    const ids = new Set<string>()
    for (const rule of rules) {
      expect(rule.id).toBeTruthy()
      expect(ids.has(rule.id)).toBe(false)
      ids.add(rule.id)
      expect(rule.names.length).toBeGreaterThan(0)
      expect(rule.reason.length).toBeGreaterThan(0)
      expect(rule.source_url).toMatch(/^https:\/\//)
    }
  })

  it('covers every seed entry the spec requires', () => {
    const ids = new Set(rules.map((r) => r.id))
    for (const id of [
      'gelatin', 'carmine', 'shellac', 'lard', 'tallow', 'suet',
      'isinglass', 'animal_rennet', 'anchovy', 'fish_sauce',
      'worcestershire_sauce', 'bone_phosphate',
      'e471', 'e472', 'e422', 'e570', 'e572', 'e920', 'e631',
      'e627', 'e635', 'polysorbate', 'e322', 'natural_flavouring',
      'vitamin_d3', 'omega_3', 'rennet', 'cheese',
      'albumen', 'ovalbumin', 'lysozyme', 'egg_lecithin',
      'yoghurt', 'curd', 'dahi', 'buttermilk', 'kefir',
      'milk', 'cream', 'butter', 'ghee', 'whey', 'casein', 'lactose', 'milk_powder',
      'onion', 'garlic', 'shallot', 'leek', 'asafoetida',
      'potato', 'carrot', 'beetroot', 'ginger', 'turmeric',
    ]) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('validates every profile and keeps all but the default unvalidated', () => {
    for (const p of profiles) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
    }
    expect(profile('strict_indian_vegetarian').validated).toBe(true)
    for (const p of profiles) {
      if (p.id !== 'strict_indian_vegetarian') expect(p.validated).toBe(false)
    }
  })
})

describe('strict_indian_vegetarian (the validated profile)', () => {
  it('rejects always_animal, egg and fermented dairy', () => {
    expect(classifyIngredientList('gelatin', siv(), rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('E120', siv(), rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('animal rennet', siv(), rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('whole egg', siv(), rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('lysozyme', siv(), rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('yoghurt', siv(), rules).kind).toBe('NOT_SAFE')
  })

  it('holds ambiguous items as undetermined, including unspecified rennet and cheese', () => {
    for (const raw of ['E471', 'rennet', 'cheese', 'natural flavourings', 'lecithin']) {
      const verdict = classifyIngredientList(raw, siv(), rules)
      expect(verdict.kind).toBe('UNDETERMINED')
      expect(verdict.reasons.length).toBeGreaterThan(0)
    }
  })

  it('allows plain dairy and known plant staples', () => {
    expect(classifyIngredientList('milk, butter, ghee', siv(), rules).kind).toBe('SAFE')
    expect(classifyIngredientList('wheat flour, water, salt', siv(), rules).kind).toBe('SAFE')
  })

  it('returns undetermined for unknown tokens and for missing data — never safe', () => {
    const unknown = classifyIngredientList('quinoa flour', siv(), rules)
    expect(unknown.kind).toBe('UNDETERMINED')
    expect(unknown.unknownTokens).toContain('quinoa flour')
    expect(classifyIngredientList('', siv(), rules).kind).toBe('UNDETERMINED')
    expect(classifyIngredientList('   ', siv(), rules).kind).toBe('UNDETERMINED')
  })

  it('rejects on the first reject token even when later tokens are unknown', () => {
    const verdict = classifyIngredientList('gelatin, mystery powder', siv(), rules)
    expect(verdict.kind).toBe('NOT_SAFE')
    expect(verdict.reasons[0]?.ruleId).toBe('gelatin')
  })
})

describe('other profiles', () => {
  it('vegetarian_uk allows egg and dairy but rejects gelatin', () => {
    const p = profile('vegetarian_uk')
    expect(classifyIngredientList('egg, milk', p, rules).kind).toBe('SAFE')
    expect(classifyIngredientList('gelatin', p, rules).kind).toBe('NOT_SAFE')
  })

  it('vegan rejects dairy and egg', () => {
    const p = profile('vegan')
    expect(classifyIngredientList('milk', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('egg white powder', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('water, salt', p, rules).kind).toBe('SAFE')
  })

  it('jain rejects root vegetables and alliums', () => {
    const p = profile('jain')
    expect(classifyIngredientList('potato, salt', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('garlic powder', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('rice, water', p, rules).kind).toBe('SAFE')
  })

  it('no_beef rejects beef but holds other animal ingredients undetermined', () => {
    const p = profile('no_beef')
    expect(classifyIngredientList('beef extract', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('gelatin', p, rules).kind).toBe('UNDETERMINED')
    expect(classifyIngredientList('rice, water', p, rules).kind).toBe('SAFE')
  })

  it('no_pork rejects pork and lard', () => {
    const p = profile('no_pork')
    expect(classifyIngredientList('pork', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('lard', p, rules).kind).toBe('NOT_SAFE')
    expect(classifyIngredientList('chicken', p, rules).kind).toBe('UNDETERMINED')
  })
})

describe('verdict invariants', () => {
  it('never returns an empty reason chain', () => {
    const raws = ['', 'gelatin', 'E471', 'milk', 'mystery x', 'milk, E471', 'milk, gelatin']
    for (const raw of raws) {
      for (const p of profiles) {
        const verdict = classifyIngredientList(raw, p, rules)
        expect(verdict.reasons.length).toBeGreaterThan(0)
        for (const reason of verdict.reasons) {
          expect(reason.reason.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('applies validated resolver overrides for unknown tokens', () => {
    const tokens = parseIngredientList('mystery powder, water')
    const before = classifyTokens(tokens, siv(), rules)
    expect(before.kind).toBe('UNDETERMINED')
    const after = classifyTokens(tokens, siv(), rules, { 'mystery powder': 'salt' })
    expect(after.kind).toBe('SAFE')
  })

  it('applies saved manufacturer-reply status overrides', () => {
    // E471 is ambiguous -> undetermined; a saved plant-derived reply allows it.
    const tokens = parseIngredientList('E471, water')
    const undetermined = classifyTokens(tokens, siv(), rules)
    expect(undetermined.kind).toBe('UNDETERMINED')
    const allowed = classifyTokens(tokens, siv(), rules, {}, { e471: 'always_plant' })
    expect(allowed.kind).toBe('SAFE')
    // An animal-derived reply rejects under the validated profile.
    const rejected = classifyTokens(tokens, siv(), rules, {}, { e471: 'always_animal' })
    expect(rejected.kind).toBe('NOT_SAFE')
  })
})
