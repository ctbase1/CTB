import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'bg-transparent text-zinc-300 hover:bg-zinc-800',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className
      )}
    >
      {loading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
      {children}
    </button>
  )
}
