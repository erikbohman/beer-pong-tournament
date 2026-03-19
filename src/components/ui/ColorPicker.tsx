import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ label, value, onChange, error, className }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-300 dark:border-dark-600">
            <input
              ref={ref}
              type="color"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="h-full w-full rounded-lg" style={{ backgroundColor: value }} />
          </div>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            maxLength={7}
            className={cn(
              'h-10 w-28 rounded-lg border border-gray-300 bg-white px-3 font-mono text-sm text-gray-900',
              'focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500',
              'dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100',
              error && 'border-red-500'
            )}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
ColorPicker.displayName = 'ColorPicker'

export { ColorPicker }
