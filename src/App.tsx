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
import { KeyboardIcon } from './ui/icons.tsx'
import { ProfilePill, ProfileSheet } from './ui/ProfilePicker.tsx'
import { ScanView } from './ui/ScanView.tsx'
import { TypeSheet } from './ui/TypeSheet.tsx'
import { VerdictSheet } from './ui/VerdictView.tsx'

const RULES = loadIngredientRules()
const PROFILES = loadProfiles()

type SheetId = 'none' | 'type' | 'profile'

export default function App() {
  const s = useAppStore()
  const [sheet, setSheet] = useState<SheetId>('none')

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
        setSheet('none')
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
      setSheet('none')
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

  const closeResult = () => {
    s.resetResult()
    setSheet('none')
  }

  const cameraPaused = sheet !== 'none' || verdict !== null
  const selectedLabel = profile.label

  return (
    <div className="ic-app">
      <ScanView
        paused={cameraPaused}
        lookingUp={s.lookupState === 'loading'}
        lookupError={verdict ? null : s.lookupError}
        onBarcode={(code) => void lookup(code)}
        onBackendChange={s.setScannerBackend}
      />

      <header className="ic-chrome-top">
        <ProfilePill label={selectedLabel} onClick={() => setSheet('profile')} />
        <button
          type="button"
          className="ic-icon-btn"
          aria-label="Type a barcode or ingredient list"
          onClick={() => setSheet('type')}
        >
          <KeyboardIcon size={20} weight="bold" />
        </button>
      </header>

      <ProfileSheet
        open={sheet === 'profile'}
        profiles={PROFILES}
        value={s.profileId}
        onChange={s.setProfileId}
        onClose={() => setSheet('none')}
      />

      <TypeSheet
        open={sheet === 'type'}
        barcode={s.barcodeInput}
        lookupState={s.lookupState}
        lookupError={s.lookupError}
        onBarcodeChange={s.setBarcodeInput}
        onLookup={(code) => void lookup(code)}
        onCheckList={(text) => {
          s.resetResult()
          s.setIngredientText(text)
          setSheet('none')
        }}
        onClose={() => setSheet('none')}
      />

      <VerdictSheet
        open={verdict !== null}
        verdict={verdict}
        product={s.product}
        resolving={s.resolving}
        onResolve={(token) => void handleResolve(token)}
        onClose={closeResult}
      >
        {verdict && verdict.kind === 'UNDETERMINED' && (
          <div className="mt-6">
            <EnquiryDraft
              brand={s.product?.brand ?? null}
              undeterminedRules={verdict.reasons}
              onSaved={s.bumpReplies}
            />
          </div>
        )}
      </VerdictSheet>
    </div>
  )
}
