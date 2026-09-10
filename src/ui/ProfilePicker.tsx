import type { ProfileRule } from '../engine/types.ts'

interface Props {
  profiles: ProfileRule[]
  value: string
  onChange: (id: string) => void
}

export function ProfilePicker({ profiles, value, onChange }: Props) {
  const selected = profiles.find((p) => p.id === value)
  return (
    <section aria-label="Dietary profile" className="rounded-lg border border-gray-300 p-4">
      <label htmlFor="profile" className="block text-sm font-semibold text-gray-900">
        Dietary profile
      </label>
      <select
        id="profile"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded border border-gray-300 bg-white p-2 text-base"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
            {p.validated ? '' : ' (unvalidated)'}
          </option>
        ))}
      </select>
      {selected && !selected.validated && (
        <p
          role="alert"
          className="mt-2 rounded border border-amber-500 bg-amber-50 p-2 text-sm text-amber-900"
        >
          Unvalidated profile: “{selected.label}” has not been validated. Results
          under this profile are experimental — only Strict Indian vegetarian is
          validated.
        </p>
      )}
      {selected?.note && <p className="mt-2 text-xs text-gray-600">{selected.note}</p>}
    </section>
  )
}
