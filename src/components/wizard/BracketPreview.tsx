import { nextPowerOf2 } from '@/lib/utils'

interface BracketPreviewProps {
  participants: string[]
}

export function BracketPreview({ participants }: BracketPreviewProps) {
  const names = participants.map(n => n || '?')
  const size = nextPowerOf2(names.length)
  const rounds = Math.log2(size)

  // Build round 1 pairs (simplified seeding for preview)
  const pairs: string[][] = []
  for (let i = 0; i < size; i += 2) {
    pairs.push([names[i] ?? 'BYE', names[i + 1] ?? 'BYE'])
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-4">
        {/* Round 1 */}
        <div className="flex flex-col justify-around gap-2">
          <p className="mb-1 text-center text-xs font-semibold text-gray-400">R1</p>
          {pairs.map((pair, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {pair.map((name, pi) => (
                <div
                  key={pi}
                  className="min-w-[90px] truncate rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300"
                >
                  {name.slice(0, 12) || '—'}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Subsequent rounds (empty placeholders) */}
        {Array.from({ length: rounds - 1 }, (_, ri) => {
          const matchesInRound = size / Math.pow(2, ri + 2)
          return (
            <div key={ri} className="flex flex-col justify-around gap-2">
              <p className="mb-1 text-center text-xs font-semibold text-gray-400">R{ri + 2}</p>
              {Array.from({ length: matchesInRound }, (_, mi) => (
                <div key={mi} className="flex flex-col gap-0.5">
                  {[0, 1].map(si => (
                    <div
                      key={si}
                      className="min-w-[90px] rounded border border-dashed border-gray-200 px-2 py-1 text-xs text-gray-300 dark:border-dark-600 dark:text-gray-600"
                    >
                      TBD
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
