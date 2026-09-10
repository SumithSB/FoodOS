import { useEffect, useMemo, useState } from 'react'
import { getCachedProduct, putCachedProduct } from './data/cache.ts'
import { fetchProduct } from './data/openFoodFacts.ts'
import { replyStatusOverrides } from './data/replies.ts'
import { classifyIngredientList, resolveTokens } from './engine/classifier.ts'
import { getProfile, loadIngredientRules, loadProfiles } from './engine/loadRules.ts'
import { normaliseToken, parseIngredientList } from './engine/parser.ts'
import { resolveToken } from './resolver/resolve.ts'
import { useAppStore } from './store.ts'
import { Button } from './ui/Button.tsx'
import { EnquiryDraft } from './ui/EnquiryDraft.tsx'
import { BarcodeIcon, ClipboardIcon } from './ui/icons.tsx'
import { ProfilePicker } from './ui/ProfilePicker.tsx'
import { ScanView } from './ui/ScanView.tsx'
import { VerdictView } from './ui/VerdictView.tsx'

const RULES = loadIngredientRules()
const PROFILES = loadProfiles()

export default function App() {
  const s = useAppStore()
  const [pasted, setPasted] = useState('')

  const profile = useMemo(() => getProfile(PROFILES, s.profileId), [s.profileId])
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
    [hasInput, s.ingredientText, profile, s.overrides, s.replyOverrides],
  )

  useEffect(() => {
    if (!hasInput) return
    const tokens = resolveTokens(parseIngredientList(s.ingredientText), RULES, s.overrides)
    void replyStatusOverrides(s.product?.brand ?? null, tokens).then((o) => {
      s.setReplyOverrides(o)
    })
    // Store actions are stable; product brand + tokens are the inputs.
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
    <div className="mx-auto min-h-svh max-w-2xl px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Instrument
        </p>
        <h1 className="font-heading text-2xl font-semibold text-foreground">ingredient-check</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Scan a UK packaged-food barcode and check it against your dietary
          profile. When in doubt the answer is undetermined.
        </p>
      </header>

      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <ProfilePicker profiles={PROFILES} value={s.profileId} onChange={s.setProfileId} />
        </div>

        <VerdictView
          verdict={verdict}
          product={s.product}
          resolving={s.resolving}
          onResolve={(token) => void handleResolve(token)}
        />

        <ScanView onBarcode={(code) => void lookup(code)} onBackendChange={s.setScannerBackend} />

        <section
          aria-label="Manual entry"
          className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="font-heading text-base font-semibold text-card-foreground">
            Enter without a camera
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void lookup(s.barcodeInput)
            }}
            className="space-y-2"
          >
            <label htmlFor="barcode" className="block text-sm font-semibold">
              Barcode
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="barcode"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="5000168001142"
                value={s.barcodeInput}
                onChange={(e) => s.setBarcodeInput(e.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm"
              />
              <Button type="submit" disabled={s.lookupState === 'loading'}>
                <BarcodeIcon />
                {s.lookupState === 'loading' ? 'Looking up…' : 'Look up'}
              </Button>
            </div>
          </form>
          <div className="space-y-2">
            <label htmlFor="paste" className="block text-sm font-semibold">
              Ingredient list
            </label>
            <textarea
              id="paste"
              rows={3}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Ingredients: wheat flour, water, salt…"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  s.resetResult()
                  s.setIngredientText(pasted)
                }}
              >
                <ClipboardIcon />
                Check pasted list
              </Button>
              {(s.product || s.ingredientText) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    s.resetResult()
                    setPasted('')
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          {s.lookupState === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {s.lookupError}
            </p>
          )}
        </section>

        {verdict && verdict.kind === 'UNDETERMINED' && (
          <EnquiryDraft
            brand={s.product?.brand ?? null}
            undeterminedRules={verdict.reasons}
            onSaved={s.bumpReplies}
          />
        )}

        <footer className="rounded-lg border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          debug scanner={s.scannerBackend} lookup={s.lookupState} rules={RULES.length}{' '}
          profiles={PROFILES.length} overrides={Object.keys(s.overrides).length}
        </footer>
      </div>
    </div>
  )
}
