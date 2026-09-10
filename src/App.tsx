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
import { SegmentedControl } from './ui/SegmentedControl.tsx'
import { VerdictView } from './ui/VerdictView.tsx'

const RULES = loadIngredientRules()
const PROFILES = loadProfiles()

export default function App() {
  const s = useAppStore()
  const [pasted, setPasted] = useState('')
  const [mode, setMode] = useState<'scan' | 'type'>('scan')

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
    <div className="mx-auto min-h-svh max-w-[430px] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="apple-nav">
        <p className="apple-caption">Ingredient Check</p>
        <h1>Check</h1>
        <p className="apple-caption mt-1 max-w-prose">
          Scan a UK barcode. When in doubt the answer is undetermined.
        </p>
        <div className="mt-3">
          <SegmentedControl
            ariaLabel="Input method"
            value={mode}
            onChange={(id) => setMode(id as 'scan' | 'type')}
            options={[
              { id: 'scan', label: 'Scan' },
              { id: 'type', label: 'Type' },
            ]}
          />
        </div>
      </header>

      <main className="space-y-6 px-4 pt-4">
        <ProfilePicker profiles={PROFILES} value={s.profileId} onChange={s.setProfileId} />

        <VerdictView
          verdict={verdict}
          product={s.product}
          resolving={s.resolving}
          onResolve={(token) => void handleResolve(token)}
        />

        {mode === 'scan' ? (
          <ScanView onBarcode={(code) => void lookup(code)} onBackendChange={s.setScannerBackend} />
        ) : (
          <section aria-label="Manual entry">
            <p className="apple-section-label">Type</p>
            <div className="apple-group">
              <form
                className="apple-group-pad space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void lookup(s.barcodeInput)
                }}
              >
                <label htmlFor="barcode" className="apple-caption block">
                  Barcode
                </label>
                <input
                  id="barcode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="5000168001142"
                  value={s.barcodeInput}
                  onChange={(e) => s.setBarcodeInput(e.target.value)}
                  className="apple-field apple-field-mono"
                />
                <Button type="submit" disabled={s.lookupState === 'loading'}>
                  <BarcodeIcon color="#fff" />
                  {s.lookupState === 'loading' ? 'Looking Up…' : 'Look Up'}
                </Button>
                <label htmlFor="paste" className="apple-caption block">
                  Ingredient list
                </label>
                <textarea
                  id="paste"
                  rows={4}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="Ingredients: wheat flour, water, salt…"
                  className="apple-field min-h-[96px]"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    s.resetResult()
                    s.setIngredientText(pasted)
                  }}
                >
                  <ClipboardIcon />
                  Check List
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
                {s.lookupState === 'error' && (
                  <p role="alert" className="text-[15px] text-[color:var(--apple-red)]">
                    {s.lookupError}
                  </p>
                )}
              </form>
            </div>
          </section>
        )}

        {verdict && verdict.kind === 'UNDETERMINED' && (
          <EnquiryDraft
            brand={s.product?.brand ?? null}
            undeterminedRules={verdict.reasons}
            onSaved={s.bumpReplies}
          />
        )}

        <p className="apple-caption px-1 font-mono">
          scanner={s.scannerBackend} lookup={s.lookupState} rules={RULES.length} profiles=
          {PROFILES.length}
        </p>
      </main>
    </div>
  )
}
