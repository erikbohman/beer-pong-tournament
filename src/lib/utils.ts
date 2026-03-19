import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a simple random UUID (for local temp IDs, not DB) */
export function localId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Fisher-Yates shuffle — returns a new array */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Returns the smallest power of 2 >= n */
export function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

/** Format a date string to locale display */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
