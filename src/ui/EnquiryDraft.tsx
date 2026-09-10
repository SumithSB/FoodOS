import { useState } from 'react'
import { saveReply } from '../data/replies.ts'
import type { ReplySource } from '../data/replies.ts'
import type { ReasonLink } from '../engine/types.ts'

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

  const handleSave = async () => {
    if (!brand) return
    await saveReply({ brand, ingredientId: ruleId, resolution: source, note })
    setDone(true)
    onSaved()
  }

  const options: Array<{ value: ReplySource; label: string }> = [
    { value: 'plant', label: 'Plant-derived' },
    { value: 'animal', label: 'Animal-derived' },
    { value: 'unclear', label: 'Unclear' },
  ]

  return (
    <li className="rounded border border-gray-200 p-2">
      <pre className="whitespace-pre-wrap text-sm text-gray-800">
        {draftText(brand, ruleName)}
      </pre>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1">
            <input
              type="radio"
              name={`source-${ruleId}`}
              checked={source === opt.value}
              onChange={() => setSource(opt.value)}
            />
            {opt.label}
          </label>
        ))}
        <input
          type="text"
          placeholder="Reply note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1"
        />
        <button
          type="button"
          disabled={!brand}
          onClick={() => void handleSave()}
          className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
        >
          Save reply
        </button>
        {done && <span className="text-xs text-green-700">Saved — verdict updated.</span>}
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
    <section aria-label="Manufacturer enquiries" className="rounded-lg border border-gray-300 p-4">
      <h2 className="text-base font-semibold text-gray-900">Ask the manufacturer</h2>
      <p className="mt-1 text-sm text-gray-600">
        For undetermined ingredients, send an enquiry naming the specific
        ingredient. Replies are stored locally under brand + ingredient and
        checked before the next verdict.
      </p>
      {!brand && (
        <p className="mt-2 text-sm text-amber-800">
          No brand is known for this product, so replies cannot be stored yet.
        </p>
      )}
      <ul className="mt-2 space-y-3">
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
