import type { ProductRecord } from '../data/openFoodFacts.ts'
import type { Verdict } from '../engine/types.ts'
import { Button } from './Button.tsx'
import { CheckCircleIcon, SearchIcon, WarningIcon, XCircleIcon } from './icons.tsx'

interface Props {
  verdict: Verdict | null
  product: ProductRecord | null
  resolving: string[]
  onResolve: (token: string) => void
}

const KIND: Record<
  Verdict['kind'],
  { label: string; className: string; Icon: typeof CheckCircleIcon }
> = {
  SAFE: { label: 'Safe', className: 'apple-status-safe', Icon: CheckCircleIcon },
  NOT_SAFE: { label: 'Not Safe', className: 'apple-status-not-safe', Icon: XCircleIcon },
  UNDETERMINED: {
    label: 'Undetermined',
    className: 'apple-status-undetermined',
    Icon: WarningIcon,
  },
}

export function VerdictView({ verdict, product, resolving, onResolve }: Props) {
  if (!verdict) return null
  const kind = KIND[verdict.kind]
  const Icon = kind.Icon

  return (
    <section aria-label="Verdict">
      <p className="apple-section-label">Verdict</p>
      <div className="apple-group">
        <div className="apple-group-pad space-y-4">
          {product && (
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.015em]">
                {product.name ?? product.barcode}
              </p>
              {product.brand && <p className="apple-caption mt-0.5">{product.brand}</p>}
            </div>
          )}
          <p role="status" aria-atomic="true" className={`apple-status ${kind.className}`}>
            <Icon size={28} weight="fill" />
            {kind.label}
          </p>
        </div>
        <div className="apple-sep" />
        <div className="apple-group-pad space-y-3">
          <p className="text-[13px] font-semibold tracking-[0.02em] text-[color:var(--apple-secondary-label)] uppercase">
            Why
          </p>
          <ul className="space-y-3">
            {verdict.reasons.map((reason, i) => (
              <li key={i}>
                <p className="text-[17px] font-semibold tracking-[-0.012em]">
                  {reason.token || 'No ingredient data'}
                </p>
                <p className="apple-caption mt-1">
                  {reason.ruleName ?? reason.status} — {reason.reason}
                </p>
                {reason.source && (
                  <a
                    href={reason.source}
                    target="_blank"
                    rel="noreferrer"
                    className="apple-link mt-1 inline-block text-[15px]"
                  >
                    Source
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
        {verdict.unknownTokens.length > 0 && (
          <>
            <div className="apple-sep" />
            <div className="apple-group-pad space-y-3">
              <p className="text-[13px] font-semibold tracking-[0.02em] text-[color:var(--apple-secondary-label)] uppercase">
                Unrecognised
              </p>
              {verdict.unknownTokens.map((token) => (
                <div key={token} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[15px]">{token}</span>
                  <Button
                    variant="secondary"
                    disabled={resolving.includes(token)}
                    onClick={() => onResolve(token)}
                    className="!w-auto !min-h-11 !px-3 !text-[15px]"
                  >
                    <SearchIcon />
                    {resolving.includes(token) ? 'Asking…' : 'Look Up'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
        {product?.allergensText && (
          <>
            <div className="apple-sep" />
            <div className="apple-group-pad">
              <p className="text-[13px] font-semibold tracking-[0.02em] text-[color:var(--apple-secondary-label)] uppercase">
                Allergens
              </p>
              <p className="mt-2 text-[17px]">Declared by manufacturer: {product.allergensText}</p>
              <p className="apple-caption mt-1">
                Passed through verbatim. Never used in the verdict and never judged for allergy
                safety.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
