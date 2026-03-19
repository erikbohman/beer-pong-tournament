import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, Moon, Sun } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Button } from '@/components/ui/Button'
import { ThemeMiniPreview } from './ThemeMiniPreview'
import { supabase } from '@/lib/supabase'
import type { Theme } from '@/lib/types'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter — Clean & Modern' },
  { value: 'Roboto', label: 'Roboto — Versatile & Friendly' },
  { value: 'Arial', label: 'Arial — Classic & Universal' },
  { value: 'Oswald', label: 'Oswald — Bold & Sporty' },
  { value: 'Press Start 2P', label: 'Press Start 2P — Retro Pixel' },
  { value: 'Bebas Neue', label: 'Bebas Neue — Strong & Impactful' },
  { value: 'Raleway', label: 'Raleway — Elegant' },
]

const schema = z.object({
  name: z.string().min(1, 'Name required').max(60),
  primary_color: z.string().default('#f97316'),
  secondary_color: z.string().default('#fb923c'),
  accent_color: z.string().default('#fbbf24'),
  background_color: z.string().default('#111827'),
  font_style: z.string().default('Inter'),
  ui_mode: z.enum(['dark', 'light']).default('dark'),
})

type FormData = z.infer<typeof schema>

interface ThemeFormProps {
  initial?: Theme
  onSave: (data: Partial<Theme> & { name: string }) => Promise<void>
  onCancel: () => void
  saving?: boolean
  saveError?: string | null
}

export function ThemeForm({ initial, onSave, onCancel, saving, saveError }: ThemeFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logo_url ?? null)
  const [bgPreview, setBgPreview] = useState<string | null>(initial?.background_image_url ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      primary_color: initial?.primary_color ?? '#f97316',
      secondary_color: initial?.secondary_color ?? '#fb923c',
      accent_color: initial?.accent_color ?? '#fbbf24',
      background_color: initial?.background_color ?? '#111827',
      font_style: initial?.font_style ?? 'Inter',
      ui_mode: initial?.ui_mode ?? 'dark',
    },
  })

  const formValues = watch()

  async function uploadFile(file: File, folder: string): Promise<string> {
    const ext = file.name.split('.').pop()
    const filename = `${folder}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('theme-assets')
      .upload(filename, file, { upsert: true })
    if (error) throw new Error(error.message)
    return supabase.storage.from('theme-assets').getPublicUrl(data.path).data.publicUrl
  }

  async function onSubmit(data: FormData) {
    setUploadError(null)
    try {
      let logo_url = initial?.logo_url ?? null
      let background_image_url = initial?.background_image_url ?? null

      if (logoFile) logo_url = await uploadFile(logoFile, 'logos')
      if (bgFile) background_image_url = await uploadFile(bgFile, 'backgrounds')

      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        ...data,
        logo_url,
        background_image_url,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleBgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBgFile(file)
    setBgPreview(URL.createObjectURL(file))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Live preview */}
      <ThemeMiniPreview
        theme={{
          ...formValues,
          logo_url: logoPreview,
          background_image_url: bgPreview,
        }}
      />

      <Input label="Theme Name" error={errors.name?.message} {...register('name')} />

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="primary_color"
          render={({ field }) => (
            <ColorPicker label="Primary Color" value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="secondary_color"
          render={({ field }) => (
            <ColorPicker label="Secondary Color" value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="accent_color"
          render={({ field }) => (
            <ColorPicker label="Accent Color" value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="background_color"
          render={({ field }) => (
            <ColorPicker label="Background Color" value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Font */}
      <Select label="Font Style" {...register('font_style')}>
        {FONT_OPTIONS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </Select>

      {/* UI Mode */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">UI Mode</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setValue('ui_mode', mode)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                formValues.ui_mode === mode
                  ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-dark-600 dark:text-gray-400'
              }`}
            >
              {mode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              {mode === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo / Icon</p>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 hover:border-orange-400 dark:border-dark-600 dark:text-gray-400">
            <Upload size={14} />
            {logoFile ? logoFile.name : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="mt-1 h-12 w-12 rounded object-contain" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Background Image</p>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 hover:border-orange-400 dark:border-dark-600 dark:text-gray-400">
            <Upload size={14} />
            {bgFile ? bgFile.name : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
          </label>
        </div>
      </div>

      {uploadError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {uploadError}
        </p>
      )}
      {saveError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed to save: {saveError}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-dark-700">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Theme'}
        </Button>
      </div>
    </form>
  )
}
