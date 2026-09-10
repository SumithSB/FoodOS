import { create } from 'zustand'
import type { ProductRecord } from './data/openFoodFacts.ts'
import type { IngredientStatus } from './engine/types.ts'
import type { ScannerBackend } from './scan/useBarcodeScanner.ts'

export type LookupState = 'idle' | 'loading' | 'offline-cache' | 'error' | 'done'

interface AppState {
  profileId: string
  barcodeInput: string
  ingredientText: string
  product: ProductRecord | null
  lookupState: LookupState
  lookupError: string | null
  /** Resolver-validated rule-id overrides, keyed by normalised token. */
  overrides: Record<string, string>
  /** Saved manufacturer-reply status overrides, keyed by normalised token. */
  replyOverrides: Record<string, IngredientStatus>
  repliesVersion: number
  resolving: string[]
  scannerBackend: ScannerBackend

  setProfileId: (id: string) => void
  setBarcodeInput: (v: string) => void
  setIngredientText: (v: string) => void
  setProduct: (p: ProductRecord | null) => void
  setLookup: (state: LookupState, error?: string | null) => void
  addOverride: (normalisedToken: string, ruleId: string) => void
  setReplyOverrides: (o: Record<string, IngredientStatus>) => void
  bumpReplies: () => void
  setResolving: (tokens: string[]) => void
  setScannerBackend: (b: ScannerBackend) => void
  resetResult: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  profileId: 'strict_indian_vegetarian',
  barcodeInput: '',
  ingredientText: '',
  product: null,
  lookupState: 'idle',
  lookupError: null,
  overrides: {},
  replyOverrides: {},
  repliesVersion: 0,
  resolving: [],
  scannerBackend: 'unknown',

  setProfileId: (id) => set({ profileId: id }),
  setBarcodeInput: (v) => set({ barcodeInput: v }),
  setIngredientText: (v) => set({ ingredientText: v }),
  setProduct: (p) => set({ product: p }),
  setLookup: (state, error = null) => set({ lookupState: state, lookupError: error }),
  addOverride: (normalisedToken, ruleId) =>
    set((s) => ({ overrides: { ...s.overrides, [normalisedToken]: ruleId } })),
  setReplyOverrides: (o) => set({ replyOverrides: o }),
  bumpReplies: () => set((s) => ({ repliesVersion: s.repliesVersion + 1 })),
  setResolving: (tokens) => set({ resolving: tokens }),
  setScannerBackend: (b) => set({ scannerBackend: b }),
  resetResult: () =>
    set({
      product: null,
      ingredientText: '',
      overrides: {},
      replyOverrides: {},
      lookupState: 'idle',
      lookupError: null,
      resolving: [],
    }),
}))
