import { distributeIntoGroups } from '@/lib/bracketUtils'

interface GroupPreviewProps {
  participants: string[]
  numGroups: number
}

export function GroupPreview({ participants, numGroups }: GroupPreviewProps) {
  if (numGroups < 2) return null

  const groups = distributeIntoGroups(participants.map((_, i) => String(i)), numGroups)

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(numGroups, 4)}, 1fr)` }}>
      {groups.map((groupIndices, gi) => (
        <div key={gi} className="rounded-lg border border-gray-200 dark:border-dark-600">
          <div className="rounded-t-lg bg-gray-50 px-2 py-1 dark:bg-dark-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Group {String.fromCharCode(65 + gi)}
            </p>
          </div>
          <div className="p-1.5">
            {groupIndices.map(idx => {
              const name = participants[Number(idx)] || '?'
              return (
                <div
                  key={idx}
                  className="truncate rounded px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-700"
                >
                  {name.slice(0, 14) || `Player ${Number(idx) + 1}`}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
