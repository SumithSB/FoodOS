import type { ProductRecord } from '../data/openFoodFacts.ts'
import type { Verdict } from '../engine/types.ts'

interface Props {
  verdict: Verdict | null
  product: ProductRecord | null
  resolving: string[]
  onResolve: (token: string) => void
}

const KIND_STYLE: Record<Verdict['kind'], string> = {
  SAFE: 'border-green-600 bg-green-50 text-green-900',
  NOT_SAFE: 'border-red-600 bg-red-50 text-red-900',
  UNDETERMINED: 'border-amber-500 bg-amber-50 text-amber-900',
}

export function VerdictView({ verdict, product, resolving, onResolve }: Props) {
  if (!verdict) {
    return (
      <section aria-label="Verdict" className="rounded-lg border border-gray-300 p-4">
        <p className="text-sm text-gray-600">
          Scan a barcode or paste an ingredient list to get a verdict.
        </p>
      </section>
    )
  }
  return (
    <section aria-label="Verdict" className="rounded-lg border border-gray-300 p-4">
      {product && (
        <div className="mb-2">
          <h2 className="text-lg font-bold text-gray-900">
            {product.name ?? product.barcode}
          </h2>
          {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
        </div>
      )}
      <p
        role="status"
        className={`inline-block rounded border px-3 py-1 text-xl font-bold ${KIND_STYLE[verdict.kind]}`}
      >
        {verdict.kind.replace('_', ' ')}
      </p>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">Why — reason chain</h3>
      <ul className="mt-1 space-y-2">
        {verdict.reasons.map((reason, i) => (
          <li key={i} className="rounded border border-gray-200 p-2 text-sm">
            <p className="font-medium text-gray-900">
              {reason.token || '(no ingredient data)'}{' '}
              <span className="font-normal text-gray-500">
                → {reason.ruleName ?? reason.status}
              </span>
            </p>
            <p className="mt-1 text-gray-700">{reason.reason}</p>
            {reason.source && (
              <a
                href={reason.source}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 underline"
              >
                Source
              </a>
            )}
          </li>
        ))}
      </ul>
      {verdict.unknownTokens.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Unrecognised ingredients — ask the resolver
          </h3>
          <ul className="mt-1 space-y-1">
            {verdict.unknownTokens.map((token) => (
              <li key={token} className="flex items-center gap-2 text-sm">
                <span className="flex-1 rounded bg-gray-100 px-2 py-1">{token}</span>
                <button
                  type="button"
                  disabled={resolving.includes(token)}
                  onClick={() => onResolve(token)}
                  className="rounded border border-gray-400 px-2 py-1 disabled:opacity-50"
                >
                  {resolving.includes(token) ? 'Asking…' : 'Look up'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {product?.allergensText && (
        <div className="mt-3 rounded border border-gray-200 p-2">
          <h3 className="text-sm font-semibold text-gray-900">Allergens</h3>
          <p className="text-sm text-gray-700">
            Declared by manufacturer: {product.allergensText}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Allergen information is passed through verbatim. It is never used in
            the verdict above and this app never judges allergy safety.
          </p>
        </div>
      )}
    </section>
  )
}
