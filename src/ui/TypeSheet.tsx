import { useState } from 'react'
import { Button } from './Button.tsx'
import { BarcodeIcon, ClipboardIcon } from './icons.tsx'
import { Sheet } from './Sheet.tsx'

interface Props {
  open: boolean
  barcode: string
  lookupState: string
  lookupError: string | null
  onBarcodeChange: (value: string) => void
  onLookup: (barcode: string) => void
  onCheckList: (text: string) => void
  onClose: () => void
}

export function TypeSheet({
  open,
  barcode,
  lookupState,
  lookupError,
  onBarcodeChange,
  onLookup,
  onCheckList,
  onClose,
}: Props) {
  const [pasted, setPasted] = useState('')

  return (
    <Sheet open={open} title="Type instead" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onLookup(barcode)
        }}
      >
        <label htmlFor="barcode" className="apple-caption block">
          Barcode
        </label>
        <input
          id="barcode"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="5000168001142"
          value={barcode}
          onChange={(e) => onBarcodeChange(e.target.value)}
          className="apple-field apple-field-mono"
        />
        <Button type="submit" disabled={lookupState === 'loading'}>
          <BarcodeIcon color="#fff" />
          {lookupState === 'loading' ? 'Looking Up…' : 'Look Up'}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        <label htmlFor="paste" className="apple-caption block">
          Ingredient list
        </label>
        <textarea
          id="paste"
          rows={5}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Ingredients: wheat flour, water, salt…"
          className="apple-field min-h-[120px]"
        />
        <Button
          variant="secondary"
          onClick={() => {
            onCheckList(pasted)
            setPasted('')
          }}
        >
          <ClipboardIcon />
          Check List
        </Button>
      </div>

      {lookupError && (
        <p role="alert" className="mt-4 text-[15px] text-[color:var(--apple-red)]">
          {lookupError}
        </p>
      )}
    </Sheet>
  )
}
