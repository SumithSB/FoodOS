import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  primary: 'apple-btn apple-btn-filled',
  secondary: 'apple-btn apple-btn-gray',
  ghost: 'apple-btn apple-btn-plain',
  danger: 'apple-btn apple-btn-filled',
}

export function Button({ variant = 'primary', className = '', type, style, ...props }: Props) {
  return (
    <button
      type={type ?? 'button'}
      className={`${VARIANTS[variant]} ${className}`}
      style={
        variant === 'danger'
          ? { background: 'var(--apple-red)', color: '#fff', ...style }
          : style
      }
      {...props}
    />
  )
}
