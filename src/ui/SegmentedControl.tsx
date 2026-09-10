interface Option {
  id: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
}

export function SegmentedControl({ options, value, onChange, ariaLabel }: Props) {
  return (
    <div role="group" aria-label={ariaLabel} className="apple-segmented">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="apple-segment"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
