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
  SAFE: {
    label: 'SAFE',
    className: 'border-accent bg-safe-bg text-accent',
    Icon: CheckCircleIcon,
  },
  NOT_SAFE: {
    label: 'NOT SAFE',
    className: 'border-destructive bg-unsafe-bg text-destructive',
    Icon: XCircleIcon,
  },
  UNDETERMINED: {
    label: 'UNDETERMINED',
    className: 'border-caution bg-caution-bg text-caution',
    Icon: WarningIcon,
  },
}

export function VerdictView({ verdict, product, resolving, onResolve }: Props) {
  if (!verdict) {
    return (
      <section
        aria-label="Verdict"
        className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground"
      >
        Scan a barcode or paste an ingredient list to get a verdict. When in
        doubt the answer is undetermined — a false safe is the only unacceptable
        failure.
      </section>
    )
  }

  const kind = KIND[verdict.kind]
  const Icon = kind.Icon

  return (
    <section
      aria-label="Verdict"
      className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      {product && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-card-foreground">
            {product.name ?? product.barcode}
          </h2>
          {product.brand && (
            <p className="text-sm text-muted-foreground">{product.brand}</p>
          )}
        </div>
      )}
      <p
        role="status"
        aria-atomic="true"
        className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 font-heading text-lg font-semibold tracking-wide whitespace-nowrap ${kind.className}`}
      >
        <Icon size={24} weight="bold" />
        {kind.label}
      </p>
      <div>
        <h3 className="font-heading text-sm font-semibold text-card-foreground">
          Why — reason chain
        </h3>
        <ul className="mt-2 space-y-2">
          {verdict.reasons.map((reason, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted/60 p-3 text-sm">
              <p className="font-medium text-card-foreground">
                {reason.token || '(no ingredient data)'}{' '}
                <span className="font-normal text-muted-foreground">
                  → {reason.ruleName ?? reason.status}
                </span>
              </p>
              <p className="mt-1 text-muted-foreground">{reason.reason}</p>
              {reason.source && (
                <a
                  href={reason.source}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-accent underline underline-offset-2"
                >
                  Source
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
      {verdict.unknownTokens.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-semibold text-card-foreground">
            Unrecognised ingredients — ask the resolver
          </h3>
          <ul className="mt-2 space-y-2">
            {verdict.unknownTokens.map((token) => (
              <li key={token} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-2 font-mono">
                  {token}
                </span>
                <Button
                  variant="secondary"
                  disabled={resolving.includes(token)}
                  onClick={() => onResolve(token)}
                  className="shrink-0"
                >
                  <SearchIcon />
                  {resolving.includes(token) ? 'Asking…' : 'Look up'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {product?.allergensText && (
        <div className="rounded-lg border border-border p-3">
          <h3 className="font-heading text-sm font-semibold text-card-foreground">
            Allergens
          </h3>
          <p className="mt-1 text-sm text-card-foreground">
            Declared by manufacturer: {product.allergensText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Allergen information is passed through verbatim. It is never used in
            the verdict above and this app never judges allergy safety.
          </p>
        </div>
      )}
    </section>
  )
}
