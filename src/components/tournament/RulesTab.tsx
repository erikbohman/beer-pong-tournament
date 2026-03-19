import type { Rules } from '@/lib/types'

interface RulesTabProps {
  rules: Rules
  primaryColor: string
}

export function RulesTab({ rules, primaryColor }: RulesTabProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--ui-card-bg)', border: '1px solid var(--ui-card-border)' }}
    >
      <h2
        className="mb-4 text-xs font-medium uppercase tracking-widest"
        style={{ color: primaryColor }}
      >
        {rules.name}
      </h2>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--ui-text-primary)', whiteSpace: 'pre-wrap' }}
      >
        {rules.content}
      </p>
    </div>
  )
}
