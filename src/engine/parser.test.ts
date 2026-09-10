import { describe, expect, it } from 'vitest'
import { normaliseToken, parseIngredientList, splitIngredientList } from './parser.ts'

describe('normaliseToken', () => {
  it('canonicalises E-number spacing and case', () => {
    expect(normaliseToken('E 471')).toBe('e471')
    expect(normaliseToken('e-472a')).toBe('e472a')
    expect(normaliseToken('E472 A')).toBe('e472a')
  })

  it('unifies hyphen and spacing variants', () => {
    expect(normaliseToken('Mono- and Diglycerides')).toBe('mono and diglycerides')
    expect(normaliseToken('mono_and diglycerides')).toBe('mono and diglycerides')
  })

  it('strips percentages and label punctuation', () => {
    expect(normaliseToken('cocoa mass 50%')).toBe('cocoa mass')
    expect(normaliseToken('  Milk Powder, ')).toBe('milk powder')
  })
})

describe('splitIngredientList', () => {
  it('splits comma lists and strips the label prefix', () => {
    expect(splitIngredientList('Ingredients: wheat flour, water, salt')).toEqual([
      'wheat flour',
      'water',
      'salt',
    ])
  })

  it('expands parenthetical sub-ingredients', () => {
    expect(
      splitIngredientList('chocolate (cocoa mass, cocoa butter), sugar'),
    ).toEqual(['cocoa mass', 'cocoa butter', 'chocolate', 'sugar'])
  })

  it('handles semicolons and nested parens without losing the outer token', () => {
    const parts = splitIngredientList('bun (flour (wheat, malted barley)); sesame')
    expect(parts).toContain('sesame')
    expect(parts).toContain('wheat')
    expect(parts).toContain('malted barley')
  })

  it('returns an empty list for blank input', () => {
    expect(splitIngredientList('')).toEqual([])
    expect(splitIngredientList('   ')).toEqual([])
  })
})

describe('parseIngredientList', () => {
  it('returns tokens with raw and normalised forms and no rule bindings', () => {
    const tokens = parseIngredientList('E471, Milk')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ raw: 'E471', normalised: 'e471', ruleId: null })
    expect(tokens[1]).toMatchObject({ raw: 'Milk', normalised: 'milk', ruleId: null })
  })
})
