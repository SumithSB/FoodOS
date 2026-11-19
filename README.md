# FoodOS

FoodOS is the home of ingredient-check, a correctness experiment for UK packaged food.

The app is an installable PWA. It reads a barcode or a pasted ingredient list and checks each ingredient against a dietary profile. It keeps no accounts, no review system, and no health scores.

## Verdicts

The engine returns `SAFE`, `NOT_SAFE`, or `UNDETERMINED`. A false `SAFE` is the failure that must not happen. Unknown ingredients and ambiguous additives stay `UNDETERMINED`.

`strict_indian_vegetarian` is the only validated profile. It allows plain dairy (milk, butter, and ghee). It rejects egg, fermented dairy, and ingredients that are always animal-derived, including named animal rennet. Unspecified cheese (including paneer) and unspecified rennet stay `UNDETERMINED`, because the coagulant is not on the label. Every other profile is unvalidated, and the interface marks it as such.

Allergens declared by the manufacturer are shown verbatim. They stay out of the verdict.

## Where the code is

`main` holds this introduction. The engine, scanner, tests, and interface are on the open pull requests:

- [Build ingredient-check PWA](https://github.com/SumithSB/FoodOS/pull/1) is `cursor/ingredient-check-pwa-579a`. It covers the engine, scanner, resolver, and eval harness.
- [Camera-first scanner UI](https://github.com/SumithSB/FoodOS/pull/2) is `cursor/camera-first-ui-579a`. It restyles the scanner. Its base is the branch above, so it is the checkout that has the current interface and the engine.

That tree expects Node 22. CI there installs from the lockfile, then typechecks, tests, builds, and runs the eval harness:

```sh
git fetch origin cursor/camera-first-ui-579a
git switch cursor/camera-first-ui-579a
npm ci
npm run typecheck
npm test
npm run build
npm run eval
```

`npm run dev` is `vite --host` with a self-signed certificate. It serves `https://<lan-ip>:5173` so a phone on the same network can open the camera.

`npm run eval` grades only `strict_indian_vegetarian`. A fixture with `expected: null` is counted as unlabelled and is not scored. The process exits 1 only when a labelled fixture is classified `SAFE` and the label is something else. Any other mismatch is printed and the process still exits 0. The five checked-in fixtures are placeholders, so a green eval does not mean a product was checked.
