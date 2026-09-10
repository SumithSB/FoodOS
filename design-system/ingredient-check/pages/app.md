# Page: App (scan → verdict)

> Overrides `MASTER.md` for the instrument UI. This is not a marketing landing page.

**Project:** ingredient-check
**Page:** app

## Layout (overrides landing pattern)

This is a single-screen PWA instrument. Do **not** use Hero + Feature grid + Testimonials.

1. Sticky header (name + profile)
2. Verdict (empty prompt, then the result as the primary surface)
3. Scan (camera first — shop lighting is the critical path)
4. Manual barcode / paste (progressive disclosure)
5. Enquiry drafts (only when UNDETERMINED)
6. Debug chip (scanner backend)

## Typography override

MASTER recommended Playfair Display / Source Serif 4 (luxury editorial). That pairing is a verified mismatch for a correctness instrument.

Use **Corporate Trust** from the typography domain instead:

- Headings: Lexend
- Body: Source Sans 3
- Mono (barcodes, E-numbers, debug): JetBrains Mono (kept from MASTER)

## Colour extras (status, not brand)

Colour is never the only indicator. Pair every verdict with an icon + word.

- SAFE: accent `#059669` + CheckCircle
- NOT_SAFE: destructive `#DC2626` + XCircle
- UNDETERMINED: caution `#B45309` + Warning
- Unvalidated profile: same caution treatment, role=alert

## Interaction

- Touch targets ≥44px, gap ≥8px
- `cursor-pointer` on all clickable elements
- `focus-visible:ring-2` using `--color-ring`
- 150–250ms hover/press opacity, no layout-shifting transforms
- `prefers-reduced-motion: reduce` disables non-essential motion
- Lookup and resolver buttons show loading then success/error
- Visible labels on every field (no placeholder-only)
