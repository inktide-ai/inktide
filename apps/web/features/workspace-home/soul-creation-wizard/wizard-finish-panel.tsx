'use client'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Atom } from '@/shared/ui/icons'

export interface WizardFinishPanelProps {
  llmName: string | null
  ttsName: string | null
  hasDiscord: boolean
  onConfirm: (name: string) => Promise<void>
}

const schema = z.object({ soulName: z.string().min(1, 'Введите название души.') })
type FormValues = z.infer<typeof schema>

export function WizardFinishPanel({ llmName, ttsName, hasDiscord, onConfirm }: WizardFinishPanelProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { soulName: '' },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await onConfirm(data.soulName.trim())
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Не удалось создать душу' })
    }
  }

  const inputCls = cn(
    'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
    'home-ui-font text-body text-[var(--text-primary)] outline-none',
    'placeholder:text-[var(--text-tertiary)] transition-colors',
    'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
  )

  const summarySteps = [
    { label: 'LLM', value: llmName, required: true },
    { label: 'Голос', value: ttsName, required: false },
    { label: 'Discord', value: hasDiscord ? 'Подключён' : null, required: false },
    { label: 'Личность', value: 'Настроена', required: false },
  ]

  return (
    <div
      className={cn(
        'flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)]',
        'bg-[var(--surface-1)]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md',
      )}
    >
      <div className="flex-shrink-0 px-6 pt-6 pb-5 text-center">
        <div
          className="mb-3 mx-auto flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)',
            color: 'var(--accent-base)',
          }}
        >
          <Atom size={20} />
        </div>
        <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Завершение и создание
        </h2>
        <p className="home-ui-font mt-1 text-body text-[var(--text-secondary)]">
          Проверьте настройки и создайте свою душу.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-5 space-y-4">
        <div>
          <span className="home-ui-font mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Название души
          </span>
          <input
            {...register('soulName')}
            type="text"
            placeholder="Моя душа…"
            className={inputCls}
            autoFocus
            autoComplete="off"
          />
          {errors.soulName && <p className="mt-1 text-2xs text-[var(--color-error-mid)]">{errors.soulName.message}</p>}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 divide-y divide-[var(--border-subtle)]">
          {summarySteps.map(({ label, value, required }) => (
            <div key={label} className="flex items-center justify-between px-3.5 py-2.5">
              <span className="home-ui-font text-body text-[var(--text-secondary)]">{label}</span>
              <span className={cn(
                'home-ui-font text-[12.5px] font-medium',
                value ? 'text-[var(--text-primary)]' : required ? 'text-[var(--color-error-mid)]' : 'text-[var(--text-tertiary)]',
              )}>
                {value
                  ? <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-online)] inline-block" />{value}</span>
                  : required
                    ? <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-strong)] inline-block" />Не выбран</span>
                    : <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.2)] inline-block" />Не выбран</span>
                }
              </span>
            </div>
          ))}
        </div>

        {errors.root && (
          <p className="home-ui-font text-body text-[var(--color-error-mid)] text-center">{errors.root.message}</p>
        )}

        <div className="border-t border-[var(--border-subtle)] -mx-6 px-6 pt-4">
          <button
            type="submit"
            disabled={!llmName || isSubmitting}
            className="home-ui-font flex h-9 w-full items-center justify-center rounded-xl text-body font-semibold text-white transition-colors hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-base)' }}
          >
            {isSubmitting ? 'Создание…' : 'Создать душу'}
          </button>
        </div>
      </form>
    </div>
  )
}
