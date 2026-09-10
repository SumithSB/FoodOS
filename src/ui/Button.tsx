import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:opacity-90 disabled:opacity-50',
  secondary:
    'border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50',
  ghost: 'text-foreground hover:bg-muted disabled:opacity-50',
  danger: 'bg-destructive text-on-destructive hover:opacity-90 disabled:opacity-50',
}

/** Shared control: 44px min height, focus-visible ring, 200ms hover. */
export function Button({ variant = 'primary', className = '', type, ...props }: Props) {
  return (
    <button
      type={type ?? 'button'}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
