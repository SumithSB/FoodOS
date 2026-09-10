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
    <section aria-label="Dietary profile">
      <p className="apple-section-label">Profile</p>
      <div className="apple-group">
        <div className="apple-row">
          <label htmlFor="profile" className="text-[17px] font-normal">
            Dietary profile
          </label>
          <select
            id="profile"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-11 max-w-[58%] cursor-pointer border-0 bg-transparent text-right text-[17px] text-[color:var(--apple-secondary-label)]"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.validated ? '' : ' (unvalidated)'}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selected && !selected.validated && (
        <p role="alert" className="apple-alert mx-1 mt-3">
          <WarningCircleIcon className="mt-0.5 shrink-0" color="var(--apple-orange)" />
          <span>
            Unvalidated profile. Results under “{selected.label}” are experimental —
            only Strict Indian vegetarian is validated.
          </span>
        </p>
      )}
      {selected?.note && <p className="apple-caption mt-2 px-5">{selected.note}</p>}
    </section>
  )
}
