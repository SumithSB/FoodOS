import type { ProfileRule } from '../engine/types.ts'
import { CaretDownIcon, CheckIcon, LeafIcon, WarningCircleIcon } from './icons.tsx'
import { Sheet } from './Sheet.tsx'

interface PillProps {
  label: string
  onClick: () => void
}

export function ProfilePill({ label, onClick }: PillProps) {
  return (
    <button type="button" className="ic-pill" onClick={onClick} aria-haspopup="dialog">
      <LeafIcon size={16} weight="fill" />
      <span className="ic-pill-label">{label}</span>
      <CaretDownIcon size={12} weight="bold" />
    </button>
  )
}

interface SheetProps {
  open: boolean
  profiles: ProfileRule[]
  value: string
  onChange: (id: string) => void
  onClose: () => void
}

export function ProfileSheet({ open, profiles, value, onChange, onClose }: SheetProps) {
  const selected = profiles.find((p) => p.id === value)

  return (
    <Sheet open={open} title="Dietary profile" onClose={onClose}>
      <div role="listbox" aria-label="Dietary profile">
        {profiles.map((profile) => {
          const selectedRow = profile.id === value
          return (
            <button
              key={profile.id}
              type="button"
              role="option"
              aria-selected={selectedRow}
              className="ic-profile-row"
              onClick={() => {
                onChange(profile.id)
                onClose()
              }}
            >
              <span>
                <span className="block text-[17px] font-semibold tracking-[-0.012em]">
                  {profile.label}
                </span>
                <span className="apple-caption mt-0.5 block">
                  {profile.validated ? 'Validated' : 'Unvalidated — experimental'}
                </span>
              </span>
              {selectedRow && <CheckIcon size={20} weight="bold" color="var(--apple-blue)" />}
            </button>
          )
        })}
      </div>
      {selected && !selected.validated && (
        <p role="alert" className="apple-alert mt-4">
          <WarningCircleIcon className="mt-0.5 shrink-0" color="var(--apple-orange)" />
          <span>
            Results under “{selected.label}” are experimental — only Strict Indian vegetarian is
            validated.
          </span>
        </p>
      )}
      {selected?.note && <p className="apple-caption mt-3">{selected.note}</p>}
    </Sheet>
  )
}
