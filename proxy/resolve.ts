// Edge proxy for the resolver. Holds the LLM key server-side — the key
// never ships in the client bundle.
//
// Contract: input is one unrecognised ingredient string plus the list of
// known rule ids. Output is `{ "ruleId": "<id>" | null }` and nothing else:
// never a status, never a category, never a verdict. The proxy returns
// null when unsure, when no key is configured, or when the model output
// fails validation. The model is explicitly prompted to prefer null over
// a plausible guess.

const SYSTEM_PROMPT = `You map a single unknown food-ingredient string to a known ingredient knowledge-base id, or to null.
Rules:
- Input: one ingredient phrase plus a list of known ids.
- Output: exactly {"ruleId": "<id>" | null}. No other fields, no prose.
- Return an id ONLY when the ingredient is certainly the same substance as that knowledge-base entry (synonym, spelling variant, or unambiguous E-number alias).
- When unsure, return {"ruleId": null}. Prefer null over a plausible guess. A wrong mapping is a critical failure; null is always acceptable.
- Never return a status, category, verdict, or explanation.`

interface ResolveBody {
  token?: unknown
  knownIds?: unknown
}

function jsonResponse(ruleId: string | null, status = 200): Response {
  return new Response(JSON.stringify({ ruleId }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function handleResolve(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  let body: ResolveBody
  try {
    body = (await req.json()) as ResolveBody
  } catch {
    return jsonResponse(null, 400)
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const knownIds = Array.isArray(body.knownIds)
    ? body.knownIds.filter((id): id is string => typeof id === 'string')
    : []
  if (!token || token.length > 200 || knownIds.length === 0) {
    return jsonResponse(null, 400)
  }

  const apiKey = typeof process !== 'undefined' ? process.env['RESOLVER_LLM_API_KEY'] : undefined
  const baseUrl =
    (typeof process !== 'undefined'
      ? process.env['RESOLVER_LLM_BASE_URL']
      : undefined) ?? 'https://api.openai.com/v1'
  const model =
    (typeof process !== 'undefined' ? process.env['RESOLVER_LLM_MODEL'] : undefined) ??
    'gpt-4o-mini'
  if (!apiKey) return jsonResponse(null)

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 60,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Ingredient: ${token}\nKnown ids: ${knownIds.join(', ')}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return jsonResponse(null)
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    const parsed = extractJsonObject(content)
    const ruleId = parsed?.['ruleId']
    if (typeof ruleId === 'string' && knownIds.includes(ruleId)) {
      return jsonResponse(ruleId)
    }
    return jsonResponse(null)
  } catch {
    return jsonResponse(null)
  }
}
