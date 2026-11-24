import type { ReactNode } from 'react'
import { CloseIcon } from './icons.tsx'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  tall?: boolean
}

export function Sheet({ open, title, onClose, children, tall = false }: Props) {
  if (!open) return null

  return (
    <div className="ic-sheet" role="dialog" aria-modal="true" aria-labelledby="ic-sheet-title">
      <button type="button" className="ic-sheet-backdrop" aria-label="Dismiss" onClick={onClose} />
      <div className={`ic-sheet-panel${tall ? ' ic-sheet-panel-tall' : ''}`}>
        <div className="ic-sheet-handle" aria-hidden="true" />
        <div className="ic-sheet-head">
          <h2 id="ic-sheet-title">{title}</h2>
          <button type="button" className="ic-sheet-close" aria-label="Close" onClick={onClose}>
            <CloseIcon size={18} weight="bold" />
          </button>
        </div>
        <div className="ic-sheet-body">{children}</div>
      </div>
    </div>
  )
}
