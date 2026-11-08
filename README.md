# FoodOS

FoodOS is the home of ingredient-check, a correctness experiment for UK packaged food.

The app is an installable PWA. It reads a barcode or a pasted ingredient list and checks each ingredient against a dietary profile. It keeps no accounts, no review system, and no health scores.

## Verdicts

The engine returns `SAFE`, `NOT_SAFE`, or `UNDETERMINED`. A false `SAFE` is the failure that must not happen. Unknown ingredients and ambiguous additives stay `UNDETERMINED`.

`strict_indian_vegetarian` is the only validated profile. It allows plain dairy. It rejects egg, fermented dairy, and ingredients that are always animal-derived. Every other profile is unvalidated, and the interface marks it as such.

Allergens declared by the manufacturer are shown verbatim. They stay out of the verdict.

## Where the code is

This branch holds the repository introduction. The engine, scanner, tests, and interface are on the open pull requests:

- [Build ingredient-check PWA](https://github.com/SumithSB/FoodOS/pull/1) covers the engine, scanner, resolver, and eval harness.
- [Camera-first scanner UI](https://github.com/SumithSB/FoodOS/pull/2) restyles the scanner. Its base is the branch from the pull request above.

That tree expects Node 22. From a checkout of the pull request branch:

```sh
npm install
npm test
npm run typecheck
npm run dev
```

`npm run dev` serves HTTPS on the LAN address so a phone can open the camera. `npm run eval` exits with status 1 when any labelled fixture is marked safe incorrectly.
