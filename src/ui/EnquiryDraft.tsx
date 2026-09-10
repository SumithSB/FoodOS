import { useState } from 'react'
import { saveReply } from '../data/replies.ts'
import type { ReplySource } from '../data/replies.ts'
import type { ReasonLink } from '../engine/types.ts'
import { Button } from './Button.tsx'
import { CopyIcon, WarningCircleIcon } from './icons.tsx'

interface Props {
  brand: string | null
  undeterminedRules: ReasonLink[]
  onSaved: () => void
}

function draftText(brand: string | null, ruleName: string | null): string {
  const who = brand ? ` at ${brand}` : ''
  const what = ruleName ?? 'the listed ingredient'
  return (
    `Hello${who},\n\nI am checking one of your products against a dietary profile. ` +
    `Could you tell me whether "${what}" in this product is plant-derived or animal-derived, ` +
    `and what its source is?\n\nThank you.`
  )
}

interface RowProps {
  brand: string | null
  ruleId: string
  ruleName: string | null
  onSaved: () => void
}

function ReplyRow({ brand, ruleId, ruleName, onSaved }: RowProps) {
  const [source, setSource] = useState<ReplySource>('unclear')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const draft = draftText(brand, ruleName)

  const handleSave = async () => {
    if (!brand) return
    await saveReply({ brand, ingredientId: ruleId, resolution: source, note })
    setDone(true)
    onSaved()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const options: Array<{ value: ReplySource; label: string }> = [
    { value: 'plant', label: 'Plant-derived' },
    { value: 'animal', label: 'Animal-derived' },
    { value: 'unclear', label: 'Unclear' },
  ]

  return (
    <li className="space-y-3 rounded-lg border border-border p-3">
      <pre className="whitespace-pre-wrap font-sans text-sm text-card-foreground">{draft}</pre>
      <Button variant="secondary" onClick={() => void handleCopy()}>
        <CopyIcon />
        {copied ? 'Copied' : 'Copy enquiry'}
      </Button>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-card-foreground">
          Manufacturer reply for {ruleName ?? ruleId}
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm"
            >
              <input
                type="radio"
                name={`source-${ruleId}`}
                checked={source === opt.value}
                onChange={() => setSource(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1">
        <label htmlFor={`note-${ruleId}`} className="text-sm font-semibold">
          Reply note
        </label>
        <input
          id={`note-${ruleId}`}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!brand} onClick={() => void handleSave()}>
          Save reply
        </Button>
        {done && (
          <span role="status" className="text-sm text-accent">
            Saved — verdict updated.
          </span>
        )}
      </div>
    </li>
  )
}

export function EnquiryDraft({ brand, undeterminedRules, onSaved }: Props) {
  const withRule = undeterminedRules.filter(
    (r) => r.ruleId !== null && !r.ruleId.startsWith('reply:'),
  )
  if (withRule.length === 0) return null

  return (
    <section
      aria-label="Manufacturer enquiries"
      className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="font-heading text-base font-semibold text-card-foreground">
        Ask the manufacturer
      </h2>
      <p className="text-sm text-muted-foreground">
        For undetermined ingredients, send an enquiry naming the specific
        ingredient. Replies are stored locally under brand + ingredient and
        checked before the next verdict.
      </p>
      {!brand && (
        <p
          role="status"
          className="flex gap-2 rounded-lg border border-caution/40 bg-caution-bg p-3 text-sm text-caution"
        >
          <WarningCircleIcon className="mt-0.5 shrink-0" />
          <span>No brand is known for this product, so replies cannot be stored yet.</span>
        </p>
      )}
      <ul className="space-y-3">
        {withRule.map((reason) => (
          <ReplyRow
            key={reason.ruleId ?? reason.token}
            brand={brand}
            ruleId={reason.ruleId ?? ''}
            ruleName={reason.ruleName}
            onSaved={onSaved}
          />
        ))}
      </ul>
    </section>
  )
}
