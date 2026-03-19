import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Globe, EyeOff, Trophy, Link2, Copy, Check } from 'lucide-react'
import { useTournaments } from '@/hooks/useTournaments'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { Tournament } from '@/lib/types'

const TYPE_LABELS: Record<Tournament['type'], string> = {
  single_elimination: 'Single Elimination',
  group_stage: 'Group Stage',
  multi_stage: 'Multi-Stage',
}

export function TournamentsPage() {
  const { user } = useAuth()
  const { tournaments, loading, error, deleteTournament, togglePublish } = useTournaments(user?.id)
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null)

  async function handleDelete() {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    await deleteTournament(deleteTarget.id)
    setDeleteTarget(null)
    setActionLoading(null)
  }

  async function handleTogglePublish(t: Tournament) {
    setActionLoading(t.id)
    const { error } = await togglePublish(t.id, t.status)
    setActionLoading(null)
    if (!error && t.status === 'draft') {
      // Was draft, now published — show success modal
      setPublishedUrl(`${window.location.origin}/tournament/${t.id}`)
      setCopied(false)
    }
  }

  async function handleCopy(url: string, rowId?: string) {
    await navigator.clipboard.writeText(url)
    if (rowId) {
      setCopiedRowId(rowId)
      setTimeout(() => setCopiedRowId(null), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        Failed to load tournaments: {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tournaments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/tournaments/new">
            <Plus size={16} />
            New Tournament
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {tournaments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 dark:border-dark-600">
          <Trophy size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tournaments yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Create your first tournament to get started
          </p>
          <Button className="mt-4" asChild>
            <Link to="/admin/tournaments/new">
              <Plus size={16} />
              New Tournament
            </Link>
          </Button>
        </div>
      )}

      {/* Table */}
      {tournaments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-dark-700 dark:bg-dark-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Participants</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {tournaments.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {TYPE_LABELS[t.type]}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {t.num_participants} {t.participant_type}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(t.start_date)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.status === 'published' ? 'success' : 'default'}>
                      {t.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const isOwner = t.created_by === user?.id
                      const publicUrl = `${window.location.origin}/tournament/${t.id}`
                      const isPublished = t.status === 'published'
                      const rowCopied = copiedRowId === t.id
                      return (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={isOwner ? 'Edit' : 'You do not own this tournament'}
                            disabled={!isOwner}
                            asChild={isOwner}
                          >
                            {isOwner ? (
                              <Link to={`/admin/tournaments/${t.id}/edit`}>
                                <Pencil size={15} />
                              </Link>
                            ) : (
                              <Pencil size={15} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={!isOwner ? 'You do not own this tournament' : isPublished ? 'Unpublish' : 'Publish'}
                            disabled={!isOwner || actionLoading === t.id}
                            onClick={() => isOwner && handleTogglePublish(t)}
                          >
                            {actionLoading === t.id ? (
                              <Spinner size="sm" />
                            ) : isPublished ? (
                              <EyeOff size={15} />
                            ) : (
                              <Globe size={15} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={isPublished ? (rowCopied ? 'Copied!' : 'Copy public link') : 'Not published yet'}
                            disabled={!isPublished}
                            className={rowCopied ? 'text-green-500' : ''}
                            onClick={() => isPublished && handleCopy(publicUrl, t.id)}
                          >
                            {rowCopied ? <Check size={15} /> : <Link2 size={15} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={isOwner ? 'Delete' : 'You do not own this tournament'}
                            className={isOwner ? 'hover:text-red-500' : ''}
                            disabled={!isOwner}
                            onClick={() => isOwner && setDeleteTarget(t)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone and will remove all participants, matches, and groups.`}
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!!actionLoading}
          >
            {actionLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>

      {/* Publish success modal */}
      <Modal
        open={!!publishedUrl}
        onOpenChange={open => { if (!open) { setPublishedUrl(null); setCopied(false) } }}
        title="Tournament Published 🎉"
        description="Your tournament is now live. Share this link with participants:"
      >
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-700">
          <code className="flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
            {publishedUrl}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => publishedUrl && handleCopy(publishedUrl)}
            className={copied ? 'text-green-600 border-green-300' : ''}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setPublishedUrl(null); setCopied(false) }}>
            Close
          </Button>
          <Button asChild>
            <a href={publishedUrl!} target="_blank" rel="noreferrer">
              Open page
            </a>
          </Button>
        </div>
      </Modal>
    </div>
  )
}
