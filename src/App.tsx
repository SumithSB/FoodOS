import { useEffect, useMemo, useState } from 'react'
import { getCachedProduct, putCachedProduct } from './data/cache.ts'
import { fetchProduct } from './data/openFoodFacts.ts'
import { replyStatusOverrides } from './data/replies.ts'
import { classifyIngredientList, resolveTokens } from './engine/classifier.ts'
import { getProfile, loadIngredientRules, loadProfiles } from './engine/loadRules.ts'
import { normaliseToken, parseIngredientList } from './engine/parser.ts'
import { resolveToken } from './resolver/resolve.ts'
import { useAppStore } from './store.ts'
import { EnquiryDraft } from './ui/EnquiryDraft.tsx'
import { ProfilePicker } from './ui/ProfilePicker.tsx'
import { ScanView } from './ui/ScanView.tsx'
import { VerdictView } from './ui/VerdictView.tsx'

const RULES = loadIngredientRules()
const PROFILES = loadProfiles()

export default function App() {
  const s = useAppStore()
  const [pasted, setPasted] = useState('')

  const profile = useMemo(
    () => getProfile(PROFILES, s.profileId),
    [s.profileId],
  )

  const hasInput = s.product !== null || s.ingredientText.trim().length > 0

  const verdict = useMemo(
    () =>
      hasInput
        ? classifyIngredientList(
            s.ingredientText,
            profile,
            RULES,
            s.overrides,
            s.replyOverrides,
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasInput, s.ingredientText, s.profileId, s.overrides, s.replyOverrides],
  )

  // Check the saved manufacturer-reply store before (re-)classifying.
  useEffect(() => {
    if (!hasInput) return
    const tokens = resolveTokens(parseIngredientList(s.ingredientText), RULES, s.overrides)
    void replyStatusOverrides(s.product?.brand ?? null, tokens).then((o) => {
      s.setReplyOverrides(o)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInput, s.ingredientText, s.product?.brand, s.overrides, s.repliesVersion])

  const lookup = async (barcode: string) => {
    const code = barcode.trim()
    if (!code) return
    s.setLookup('loading')
    try {
      const cached = await getCachedProduct(code).catch(() => null)
      if (cached) {
        s.setProduct(cached)
        s.setIngredientText(cached.ingredientsText ?? '')
        s.setLookup('done')
        return
      }
      const product = await fetchProduct(code)
      if (!product) {
        s.setLookup('error', 'Product not found on Open Food Facts.')
        return
      }
      await putCachedProduct(product).catch(() => {})
      s.setProduct(product)
      s.setIngredientText(product.ingredientsText ?? '')
      s.setLookup('done')
    } catch (err) {
      s.setLookup('error', err instanceof Error ? err.message : 'Lookup failed.')
    }
  }

  const handleResolve = async (token: string) => {
    if (s.resolving.includes(token)) return
    s.setResolving([...s.resolving, token])
    try {
      const ruleId = await resolveToken(token)
      if (ruleId) s.addOverride(normaliseToken(token), ruleId)
    } finally {
      s.setResolving(s.resolving.filter((t) => t !== token))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">ingredient-check</h1>
        <p className="text-sm text-gray-600">
          Scan a UK packaged-food barcode and check it against your dietary
          profile. When in doubt the answer is undetermined — a false safe is
          the only unacceptable failure.
        </p>
      </header>

      <ProfilePicker profiles={PROFILES} value={s.profileId} onChange={s.setProfileId} />

      <ScanView onBarcode={(code) => void lookup(code)} onBackendChange={s.setScannerBackend} />

      <section aria-label="Manual entry" className="rounded-lg border border-gray-300 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void lookup(s.barcodeInput)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            inputMode="numeric"
            aria-label="Barcode"
            placeholder="Type a barcode, e.g. 5000168001142"
            value={s.barcodeInput}
            onChange={(e) => s.setBarcodeInput(e.target.value)}
            className="min-w-0 flex-1 rounded border border-gray-300 p-2"
          />
          <button type="submit" className="rounded bg-gray-900 px-4 py-2 text-white">
            Look up
          </button>
        </form>
        <label htmlFor="paste" className="mt-3 block text-sm font-semibold text-gray-900">
          Or paste an ingredient list
        </label>
        <textarea
          id="paste"
          rows={3}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Ingredients: wheat flour, water, salt…"
          className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              s.resetResult()
              s.setIngredientText(pasted)
            }}
            className="rounded border border-gray-400 px-4 py-2"
          >
            Check pasted list
          </button>
          {(s.product || s.ingredientText) && (
            <button
              type="button"
              onClick={() => {
                s.resetResult()
                setPasted('')
              }}
              className="rounded border border-gray-200 px-4 py-2 text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
        {s.lookupState === 'loading' && <p className="mt-2 text-sm">Looking up…</p>}
        {s.lookupState === 'error' && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {s.lookupError}
          </p>
        )}
      </section>

      <VerdictView
        verdict={verdict}
        product={s.product}
        resolving={s.resolving}
        onResolve={(token) => void handleResolve(token)}
      />

      {verdict && verdict.kind === 'UNDETERMINED' && (
        <EnquiryDraft
          brand={s.product?.brand ?? null}
          undeterminedRules={verdict.reasons}
          onSaved={s.bumpReplies}
        />
      )}

      <footer className="rounded border border-dashed border-gray-300 p-2 font-mono text-xs text-gray-500">
        debug: scanner={s.scannerBackend} lookup={s.lookupState} rules=
        {RULES.length} profiles={PROFILES.length} overrides=
        {Object.keys(s.overrides).length}
      </footer>
    </div>
  )
}
