import { useState } from 'react'
import { Plus, Palette } from 'lucide-react'
import { useThemes } from '@/hooks/useThemes'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ThemeCard } from '@/components/themes/ThemeCard'
import { ThemeForm } from '@/components/themes/ThemeForm'
import type { Theme } from '@/lib/types'

export function ThemesPage() {
  const { themes, loading, error, upsertTheme, deleteTheme } = useThemes()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Theme | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave(data: Partial<Theme> & { name: string }) {
    setSaving(true)
    setSaveError(null)
    const { error } = await upsertTheme(data)
    setSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteTheme(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(theme: Theme) {
    setEditTarget(theme)
    setFormOpen(true)
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
        Failed to load themes: {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Themes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {themes.length} theme{themes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          New Theme
        </Button>
      </div>

      {/* Empty state */}
      {themes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 dark:border-dark-600">
          <Palette size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No themes yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Create themes to customize the look of your tournaments
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={16} />
            New Theme
          </Button>
        </div>
      )}

      {/* Grid */}
      {themes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onOpenChange={open => {
          if (!open) {
            setFormOpen(false)
            setEditTarget(null)
          }
        }}
        title={editTarget ? 'Edit Theme' : 'New Theme'}
        className="max-w-xl"
      >
        <ThemeForm
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditTarget(null); setSaveError(null) }}
          saving={saving}
          saveError={saveError}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete Theme"
        description={`Delete "${deleteTarget?.name}"? Tournaments using this theme will lose their theme assignment.`}
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
