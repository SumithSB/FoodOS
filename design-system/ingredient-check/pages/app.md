# Page: App (scan → verdict)

> Overrides `MASTER.md`. This is a camera-first scanner, not a Settings list and not a marketing landing page.

**Project:** ingredient-check
**Page:** app

## Layout

Full-bleed dark camera stage. Type-in and results live in bottom sheets.

1. Camera viewfinder (corner brackets, shutter, glass chrome)
2. Profile pill (top-left) opens a profile sheet
3. Keyboard button (top-right) opens type/paste sheet
4. Verdict bottom sheet (product art + large status + reasons)
5. Enquiry drafts only when UNDETERMINED, inside the verdict sheet

Debug chrome stays off the main surface.

## Typography

SF Pro / system stack from Apple HIG tokens. Mono for barcodes and E-numbers.

## Colour extras (status, not brand)

Colour is never the only indicator. Pair every verdict with an icon + word.

- SAFE: `--apple-green` + CheckCircle
- NOT_SAFE: `--apple-red` + XCircle
- UNDETERMINED: `--apple-orange` + Warning
- Unvalidated profile: same caution treatment, role=alert

Camera chrome is always dark. Sheets follow system light/dark grouped backgrounds.

## Interaction

- Touch targets ≥44px, gap ≥8px
- `cursor-pointer` on all clickable elements
- Spring press `scale(0.965)` with `--apple-ease-interactive`
- `prefers-reduced-motion: reduce` disables scan-line, sheet slide, and press scale
- Visible labels on every field (no placeholder-only)
