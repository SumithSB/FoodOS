import type { ProfileRule } from '../engine/types.ts'
import { WarningCircleIcon } from './icons.tsx'

interface Props {
  profiles: ProfileRule[]
  value: string
  onChange: (id: string) => void
}

export function ProfilePicker({ profiles, value, onChange }: Props) {
  const selected = profiles.find((p) => p.id === value)
  return (
    <section aria-label="Dietary profile" className="space-y-3">
      <label htmlFor="profile" className="block text-sm font-semibold text-foreground">
        Dietary profile
      </label>
      <select
        id="profile"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full cursor-pointer rounded-lg border border-border bg-card px-3 text-base text-card-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
            {p.validated ? '' : ' — unvalidated'}
          </option>
        ))}
      </select>
      {selected && !selected.validated && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg border border-caution/40 bg-caution-bg p-3 text-sm text-caution"
        >
          <WarningCircleIcon className="mt-0.5 shrink-0" />
          <span>
            Unvalidated profile: “{selected.label}” has not been validated. Results
            under this profile are experimental — only Strict Indian vegetarian is
            validated.
          </span>
        </p>
      )}
      {selected?.note && (
        <p className="text-sm text-muted-foreground">{selected.note}</p>
      )}
    </section>
  )
}
