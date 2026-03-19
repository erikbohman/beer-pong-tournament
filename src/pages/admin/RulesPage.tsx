import { useState } from 'react'
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { useRules } from '@/hooks/useRules'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { Rules } from '@/lib/types'

interface RulesFormProps {
  initial?: Rules
  onSave: (data: { name: string; content: string; id?: string }) => Promise<void>
  onCancel: () => void
  saving?: boolean
  saveError?: string | null
}

function RulesForm({ initial, onSave, onCancel, saving, saveError }: RulesFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setContentError(null)
    let valid = true
    if (!name.trim()) { setNameError('Name is required'); valid = false }
    if (!content.trim()) { setContentError('Rules content is required'); valid = false }
    if (!valid) return
    await onSave({ name: name.trim(), content: content.trim(), ...(initial?.id ? { id: initial.id } : {}) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Rule Set Name"
        placeholder="e.g. Standard Beer Pong Rules"
        value={name}
        onChange={e => setName(e.target.value)}
        error={nameError ?? undefined}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Rules Content
        </label>
        <textarea
          rows={12}
          placeholder={"1. Each team stands at opposite ends of the table.\n2. ..."}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {contentError && (
          <p className="text-xs text-red-600 dark:text-red-400">{contentError}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Each new line will be displayed as a new line on the tournament page.
        </p>
      </div>

      {saveError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed to save: {saveError}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-dark-700">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Rule Set'}
        </Button>
      </div>
    </form>
  )
}

export function RulesPage() {
  const { rules, loading, error, upsertRules, deleteRules } = useRules()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Rules | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Rules | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave(data: { name: string; content: string; id?: string }) {
    setSaving(true)
    setSaveError(null)
    const { error } = await upsertRules(data as Parameters<typeof upsertRules>[0])
    setSaving(false)
    if (error) { setSaveError(error); return }
    setFormOpen(false)
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteRules(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  function openCreate() { setEditTarget(null); setFormOpen(true) }
  function openEdit(item: Rules) { setEditTarget(item); setFormOpen(true) }

  if (loading) {
    return <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        Failed to load rules: {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Rules</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rules.length} rule set{rules.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          New Rule Set
        </Button>
      </div>

      {/* Empty state */}
      {rules.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 dark:border-dark-600">
          <BookOpen size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No rule sets yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Create rule sets to attach to your tournaments
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={16} />
            New Rule Set
          </Button>
        </div>
      )}

      {/* List */}
      {rules.length > 0 && (
        <div className="flex flex-col gap-3">
          {rules.map(item => (
            <div
              key={item.id}
              className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {item.content}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-200"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onOpenChange={open => { if (!open) { setFormOpen(false); setEditTarget(null) } }}
        title={editTarget ? 'Edit Rule Set' : 'New Rule Set'}
        className="max-w-xl"
      >
        <RulesForm
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
        title="Delete Rule Set"
        description={`Delete "${deleteTarget?.name}"? Tournaments using these rules will lose their rules assignment.`}
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
