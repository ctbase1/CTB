import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-500',
  secondary: 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700',
  danger:    'bg-red-600 text-white hover:bg-red-500',
  ghost:     'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900',
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
