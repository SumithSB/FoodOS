// Pure classifier: (tokens, profile) -> Verdict + ReasonChain.
// No React, no fetch, no browser APIs. Runs unchanged in Node.
//
// Governing rule: a false SAFE is the only unacceptable failure.
// When in doubt the classifier returns UNDETERMINED with a reason.

import { normaliseToken, parseIngredientList } from './parser.ts'
import type {
  IngredientRule,
  ProfileRule,
  ReasonLink,
  Token,
  Verdict,
} from './types.ts'

export type { VerdictKind } from './types.ts'

/** Build a normalised-name -> rule lookup from the knowledge base. */
export function buildRuleIndex(rules: IngredientRule[]): Map<string, IngredientRule> {
  const index = new Map<string, IngredientRule>()
  for (const rule of rules) {
    for (const name of rule.names) {
      const key = normaliseToken(name)
      if (key && !index.has(key)) index.set(key, rule)
    }
    const idKey = normaliseToken(rule.id.replace(/_/g, ' '))
    if (idKey && !index.has(idKey)) index.set(idKey, rule)
  }
  return index
}

export function matchRule(
  normalised: string,
  index: Map<string, IngredientRule>,
): IngredientRule | null {
  return index.get(normalised) ?? null
}

/**
 * Resolve tokens against the knowledge base (fills ruleId/status).
 * `overrides` maps a normalised token to a known rule id — the only way
 * resolver suggestions re-enter the engine, and only after the caller has
 * validated the id exists in the rules.
 * `statusOverrides` maps a normalised token to a caller-verified status
 * (used for saved manufacturer replies keyed by brand + ingredient).
 */
export function resolveTokens(
  tokens: Token[],
  rules: IngredientRule[],
  overrides: Record<string, string> = {},
  statusOverrides: Record<string, IngredientRule['status']> = {},
): Token[] {
  const index = buildRuleIndex(rules)
  const byId = new Map(rules.map((r) => [r.id, r]))
  return tokens.map((token) => {
    const statusOverride = statusOverrides[token.normalised]
    const overrideId = overrides[token.normalised]
    let rule: IngredientRule | null = null
    if (overrideId !== undefined) {
      const direct = byId.get(overrideId)
      if (direct !== undefined) rule = direct
    }
    if (rule === null) {
      const named = matchRule(token.normalised, index)
      if (named !== null) rule = named
    }
    if (statusOverride !== undefined) {
      return {
        ...token,
        ruleId: rule ? rule.id : `reply:${token.normalised}`,
        status: statusOverride,
      }
    }
    return {
      ...token,
      ruleId: rule ? rule.id : null,
      status: rule ? rule.status : null,
    }
  })
}

function allowedReason(token: Token, rule: IngredientRule, profile: ProfileRule): ReasonLink {
  return {
    token: token.raw,
    ruleId: rule.id,
    ruleName: rule.names[0] ?? rule.id,
    status: rule.status,
    reason: `"${token.raw}" matches "${rule.names[0] ?? rule.id}" (${token.status}), which the "${profile.label}" profile allows. ${rule.reason}`,
    source: rule.source_url || null,
  }
}

/**
 * Classify already-parsed tokens under a profile.
 * - Any token in a reject category -> NOT_SAFE (stops at the first).
 * - Any undetermined-category or unidentified token -> UNDETERMINED.
 * - SAFE only when every token resolves to an allowed category.
 * Every verdict carries a non-empty reason chain.
 */
export function classifyTokens(
  tokens: Token[],
  profile: ProfileRule,
  rules: IngredientRule[],
  overrides: Record<string, string> = {},
  statusOverrides: Record<string, IngredientRule['status']> = {},
): Verdict {
  if (tokens.length === 0) {
    return {
      kind: 'UNDETERMINED',
      profile: profile.id,
      reasons: [
        {
          token: '',
          ruleId: null,
          ruleName: null,
          status: 'no_data',
          reason:
            'No ingredient data was available for this product, so acceptability cannot be determined.',
          source: null,
        },
      ],
      unknownTokens: [],
    }
  }

  const resolved = resolveTokens(tokens, rules, overrides, statusOverrides)
  const rejectIds = new Set(profile.reject_ids ?? [])
  const undeterminedIds = new Set(profile.undetermined_ids ?? [])
  const allowed: ReasonLink[] = []
  const undetermined: ReasonLink[] = []
  const unknownTokens: string[] = []

  for (const token of resolved) {
    let rule: IngredientRule | null = null
    if (token.ruleId) {
      const found = rules.find((r) => r.id === token.ruleId)
      if (found !== undefined) rule = found
    }
    if (
      rule === null &&
      token.ruleId !== null &&
      token.ruleId.startsWith('reply:') &&
      token.status !== null
    ) {
      rule = {
        id: token.ruleId,
        names: [token.raw],
        status: token.status,
        reason: 'Confirmed by a manufacturer reply saved for this brand; recorded locally.',
        source_url: '',
      }
    }
    if (!rule || !token.status) {
      undetermined.push({
        token: token.raw,
        ruleId: null,
        ruleName: null,
        status: 'unknown',
        reason: `"${token.raw}" is not in the knowledge base, so it cannot be verified. Treated as undetermined rather than assumed safe.`,
        source: null,
      })
      unknownTokens.push(token.raw)
      continue
    }
    if (rejectIds.has(rule.id) || (token.status !== null && profile.reject.includes(token.status))) {
      return {
        kind: 'NOT_SAFE',
        profile: profile.id,
        reasons: [
          {
            token: token.raw,
            ruleId: rule.id,
            ruleName: rule.names[0] ?? rule.id,
            status: rule.status,
            reason: `"${token.raw}" matches "${rule.names[0] ?? rule.id}" (${token.status}), which the "${profile.label}" profile rejects. ${rule.reason}`,
            source: rule.source_url || null,
          },
        ],
        unknownTokens,
      }
    }
    if (
      undeterminedIds.has(rule.id) ||
      (token.status !== null && profile.undetermined.includes(token.status))
    ) {
      undetermined.push({
        token: token.raw,
        ruleId: rule.id,
        ruleName: rule.names[0] ?? rule.id,
        status: rule.status,
        reason: `"${token.raw}" matches "${rule.names[0] ?? rule.id}" (${token.status}), whose source cannot be determined from the label. ${rule.reason}`,
        source: rule.source_url || null,
      })
      continue
    }
    allowed.push(allowedReason(token, rule, profile))
  }

  if (undetermined.length > 0) {
    return { kind: 'UNDETERMINED', profile: profile.id, reasons: undetermined, unknownTokens }
  }
  return { kind: 'SAFE', profile: profile.id, reasons: allowed, unknownTokens }
}

/** Convenience: raw ingredient string + profile + rules -> Verdict. */
export function classifyIngredientList(
  raw: string,
  profile: ProfileRule,
  rules: IngredientRule[],
  overrides: Record<string, string> = {},
  statusOverrides: Record<string, IngredientRule['status']> = {},
): Verdict {
  return classifyTokens(parseIngredientList(raw), profile, rules, overrides, statusOverrides)
}
