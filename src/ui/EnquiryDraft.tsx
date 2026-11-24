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

function ReplyRow({
  brand,
  ruleId,
  ruleName,
  onSaved,
}: {
  brand: string | null
  ruleId: string
  ruleName: string | null
  onSaved: () => void
}) {
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
    { value: 'plant', label: 'Plant' },
    { value: 'animal', label: 'Animal' },
    { value: 'unclear', label: 'Unclear' },
  ]

  return (
    <li className="ic-reason space-y-3">
      <pre className="whitespace-pre-wrap font-[var(--apple-font-sans)] text-[15px] leading-5">
        {draft}
      </pre>
      <Button variant="secondary" onClick={() => void handleCopy()}>
        <CopyIcon />
        {copied ? 'Copied' : 'Copy Enquiry'}
      </Button>
      <fieldset>
        <legend className="apple-caption mb-2">Reply for {ruleName ?? ruleId}</legend>
        <div className="apple-segmented !grid-cols-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="apple-segment"
              aria-pressed={source === opt.value}
              onClick={() => setSource(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`note-${ruleId}`} className="apple-caption block">
        Reply note
      </label>
      <input
        id={`note-${ruleId}`}
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="apple-field"
      />
      <Button disabled={!brand} onClick={() => void handleSave()}>
        Save Reply
      </Button>
      {done && (
        <p role="status" className="text-[15px] text-[color:var(--apple-green)]">
          Saved — verdict updated.
        </p>
      )}
    </li>
  )
}

export function EnquiryDraft({ brand, undeterminedRules, onSaved }: Props) {
  const withRule = undeterminedRules.filter(
    (r) => r.ruleId !== null && !r.ruleId.startsWith('reply:'),
  )
  if (withRule.length === 0) return null

  return (
    <section aria-label="Manufacturer enquiries">
      <p className="apple-section-label">Manufacturer</p>
      <p className="apple-caption mb-3">
        For undetermined ingredients, send an enquiry naming the specific ingredient. Replies are
        stored locally under brand + ingredient.
      </p>
      {!brand && (
        <p role="status" className="apple-alert mb-4">
          <WarningCircleIcon className="mt-0.5 shrink-0" color="var(--apple-orange)" />
          <span>No brand is known, so replies cannot be stored yet.</span>
        </p>
      )}
      <ul>
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
