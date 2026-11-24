import type { ReactNode } from 'react'
import type { ProductRecord } from '../data/openFoodFacts.ts'
import type { Verdict } from '../engine/types.ts'
import { Button } from './Button.tsx'
import { BarcodeIcon, CheckCircleIcon, SearchIcon, WarningIcon, XCircleIcon } from './icons.tsx'
import { Sheet } from './Sheet.tsx'

interface Props {
  open: boolean
  verdict: Verdict | null
  product: ProductRecord | null
  resolving: string[]
  onResolve: (token: string) => void
  onClose: () => void
  children?: ReactNode
}

const KIND: Record<
  Verdict['kind'],
  {
    label: string
    copy: string
    className: string
    Icon: typeof CheckCircleIcon
  }
> = {
  SAFE: {
    label: 'Safe',
    copy: 'Fits this dietary profile. Every recognised ingredient is allowed.',
    className: 'ic-verdict-safe',
    Icon: CheckCircleIcon,
  },
  NOT_SAFE: {
    label: 'Not Safe',
    copy: 'Does not fit this profile. One or more ingredients are rejected.',
    className: 'ic-verdict-not-safe',
    Icon: XCircleIcon,
  },
  UNDETERMINED: {
    label: 'Undetermined',
    copy: 'Not enough to call this Safe. When in doubt, the answer stays undetermined.',
    className: 'ic-verdict-undetermined',
    Icon: WarningIcon,
  },
}

export function VerdictSheet({
  open,
  verdict,
  product,
  resolving,
  onResolve,
  onClose,
  children,
}: Props) {
  if (!verdict) return null
  const kind = KIND[verdict.kind]
  const Icon = kind.Icon
  const title = product?.name ?? (product ? product.barcode : 'Ingredient list')

  return (
    <Sheet open={open} title="Result" onClose={onClose} tall>
      <div className="ic-product">
        <div className={`ic-product-art${product?.imageUrl ? '' : ' ic-product-art-empty'}`}>
          {product?.imageUrl ? (
            <img src={product.imageUrl} alt="" />
          ) : (
            <BarcodeIcon size={28} weight="duotone" />
          )}
        </div>
        <div className="min-w-0">
          <h3>{title}</h3>
          {product?.brand && <p className="apple-caption mt-1">{product.brand}</p>}
          {product?.barcode && (
            <p className="apple-caption mt-0.5 font-mono">{product.barcode}</p>
          )}
        </div>
      </div>

      <div className={`ic-verdict-banner ${kind.className}`}>
        <Icon size={36} weight="fill" />
        <div className="ic-verdict-copy">
          <strong role="status" aria-atomic="true">
            {kind.label}
          </strong>
          <p>{kind.copy}</p>
        </div>
      </div>

      <p className="apple-section-label">Why</p>
      <ul>
        {verdict.reasons.map((reason, i) => (
          <li key={i} className="ic-reason">
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

      {verdict.unknownTokens.length > 0 && (
        <div className="mt-4">
          <p className="apple-section-label">Unrecognised</p>
          {verdict.unknownTokens.map((token) => (
            <div key={token} className="ic-reason flex items-center gap-2">
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
      )}

      {product?.allergensText && (
        <div className="mt-4">
          <p className="apple-section-label">Allergens</p>
          <p className="text-[17px]">Declared by manufacturer: {product.allergensText}</p>
          <p className="apple-caption mt-1">
            Passed through verbatim. Never used in the verdict and never judged for allergy safety.
          </p>
        </div>
      )}

      {children}

      <div className="mt-6">
        <Button variant="secondary" onClick={onClose}>
          Scan again
        </Button>
      </div>
    </Sheet>
  )
}
