# ingredient-check

An installable PWA that scans a UK packaged-food barcode (or accepts a
pasted ingredient list) and decides whether the product is acceptable under
a selected dietary profile. This is a correctness experiment with a real
scanning interface — not a consumer product. No accounts, no backend
database, no social features, no reviews, no restaurant data, no health
scores.

## The governing rule

Three verdicts: `SAFE`, `NOT_SAFE`, `UNDETERMINED`. A false `SAFE` is the
only unacceptable failure. When in doubt the engine returns `UNDETERMINED`
with a reason. It never guesses.

## Quick start

Requires Node 22+.

```sh
npm install
npm run dev        # HTTPS dev server (needed for camera testing on a phone over LAN)
npm test           # engine unit tests (vitest)
npm run typecheck  # tsc -b
npm run build      # production build + PWA bundle
npm run eval       # headless eval harness (exit 1 on any FALSE SAFE)
```

Open the printed `https://<lan-ip>:5173` URL on a real phone to test camera
scanning. The scan view shows which backend is active (`native` for
`BarcodeDetector`, `zxing` for the fallback).

## Layout

- `src/engine/` — pure TypeScript: `parser.ts`, `classifier.ts`, `types.ts`,
  `rules/*.yaml`. Zero React, zero network calls, zero browser APIs; runs
  unchanged in Node.
- `src/scan/` — camera hook (`BarcodeDetector` + `@zxing/browser` fallback).
- `src/data/` — Open Food Facts client, IndexedDB cache, manufacturer-reply
  store helpers.
- `src/resolver/` — resolver client (unknown tokens only; returns a rule id
  or `null`).
- `src/ui/` — `ScanView`, `VerdictView`, `ProfilePicker`, `EnquiryDraft`.
- `proxy/` — Vercel Edge Function holding the LLM key (`RESOLVER_LLM_API_KEY`).
- `eval/` — headless harness importing `src/engine` directly. Fixture
  `expected` values must be human-authored; the five checked-in entries are
  placeholders with `expected: null`.

## Profiles

`strict_indian_vegetarian` is the default and the only validated profile.
Every other profile carries `validated: false` and the UI shows an
"unvalidated profile" banner when one is selected. No halal, gluten-free,
or allergen profiles by design — allergens are passed through verbatim as
declared by the manufacturer and never enter the verdict.
