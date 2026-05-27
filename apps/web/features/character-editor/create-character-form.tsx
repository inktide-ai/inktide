'use client'
import { useRef, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'
import { IconUser, IconSkills, IconPaint, IconScene, IconMemory, IconBrain, IconMicrophone } from './tab-icons'
import { Add, ArrowLeft, Edit } from '@/shared/ui/icons'
import SkillsTab from './tabs/skills-tab'
import ModelTab from './tabs/model-tab'
import SceneTab from './tabs/scene-tab'
import MemoryTab from './tabs/memory-tab'
// fsd:cross-feature-ok — character-editor IS the soul editor; brain-tab is composed here
import BrainTab from '@/features/brain/components/brain-tab'
import VoiceTab from './tabs/voice-tab'

const PencilIcon = () => <Edit />
const BackIcon = () => <ArrowLeft />
const PlusIcon = () => <Add />

type CreateTabId = 'profile' | 'skills' | 'avatars' | 'scene' | 'memory' | 'brain' | 'voice'

interface CreateCharacterFormProps {
  onSave: (c: Omit<AiCharacter, 'id'>) => void
  onCancel: () => void
  defaultValues: Omit<AiCharacter, 'id'>
}

const inputCls = 'w-full py-[0.625rem] px-[0.875rem] bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] outline-none transition-[border-color,background] duration-[120ms] ease focus:border-white/20 focus:bg-[#26282e] placeholder:text-[rgba(139,144,154,0.45)]'
const textareaCls = `${inputCls} min-h-[120px] resize-y leading-relaxed`
const labelCls = 'block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2'

const CreateCharacterForm = ({ onSave, onCancel, defaultValues }: CreateCharacterFormProps) => {
  const { t } = useTranslation('profile')
  const [draft, setDraft] = useState(defaultValues)
  const [greeting, setGreeting] = useState('')
  const [activeTab, setActiveTab] = useState<CreateTabId>('profile')
  const avatarRef = useRef<HTMLInputElement>(null)

  const CREATE_TABS = useMemo((): { id: CreateTabId; label: string; icon: React.ReactNode }[] => [
    { id: 'profile', label: t('tabs.profile.label'), icon: <IconUser /> },
    { id: 'skills',  label: t('tabs.skills.label'),  icon: <IconSkills /> },
    { id: 'avatars', label: t('tabs.avatars.label'), icon: <IconPaint /> },
    { id: 'scene',   label: t('tabs.scene.label'),   icon: <IconScene /> },
    { id: 'memory',  label: t('tabs.memory.label'),  icon: <IconMemory /> },
    { id: 'brain',   label: t('tabs.brain.label'),   icon: <IconBrain /> },
    { id: 'voice',   label: t('tabs.voice.label'),   icon: <IconMicrophone /> },
  ], [t])

  const handleUpdate = (patch: Partial<AiCharacter>) => {
    setDraft((d) => ({ ...d, ...patch }))
  }

  const handleSave = () => {
    if (!draft.name.trim()) return
    const slug = draft.slug || draft.name.toLowerCase().replace(/\s+/g, '-')
    const systemPrompt = greeting.trim()
      ? `${draft.systemPrompt}\n\nFirst message to user: ${greeting}`
      : draft.systemPrompt
    onSave({ ...draft, slug, systemPrompt })
  }

  const characterForTabs = { ...draft, id: '' } as AiCharacter

  return (
    <div className="max-w-[1100px] w-full mx-auto px-4 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-(--border)">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 p-0 bg-transparent border-none rounded-lg text-(--text-muted) text-[1.25rem] cursor-pointer transition-[background,color] duration-200 ease shrink-0 hover:bg-white/[0.06] hover:text-(--text-primary)"
            onClick={onCancel}
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <nav className="flex items-center gap-1 flex-wrap">
            {CREATE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'flex items-center gap-2 px-[0.875rem] py-2 bg-transparent border border-transparent rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease',
                  activeTab === tab.id
                    ? 'text-[#a78bfa] bg-[rgba(139,92,246,0.15)]'
                    : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-white/[0.04]',
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="flex items-center justify-center w-[18px] h-[18px] text-inherit">
                  {tab.icon}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2 bg-(--accent-red) text-white border-none rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-[background] duration-200 ease mr-4 shrink-0 hover:bg-(--accent-red-bright) [&>svg]:w-4 [&>svg]:h-4"
          onClick={handleSave}
        >
          <PlusIcon />
          <span>{t('create.submit')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="animate-[panelIn_0.2s_ease]">
        {activeTab === 'profile' && (
          <CreateIdentitySection
            draft={draft}
            greeting={greeting}
            onUpdate={handleUpdate}
            setGreeting={setGreeting}
            avatarRef={avatarRef}
          />
        )}
        {activeTab === 'skills' && <SkillsTab character={characterForTabs} onUpdate={handleUpdate} />}
        {activeTab === 'avatars' && <ModelTab character={characterForTabs} onUpdate={handleUpdate} />}
        {activeTab === 'scene' && <SceneTab character={characterForTabs} onUpdate={handleUpdate} />}
        {activeTab === 'memory' && <MemoryTab character={characterForTabs} onUpdate={handleUpdate} />}
        {activeTab === 'brain' && <BrainTab character={characterForTabs} onUpdate={handleUpdate} />}
        {activeTab === 'voice' && <VoiceTab character={characterForTabs} onUpdate={handleUpdate} />}
      </div>
    </div>
  )
}

interface CreateIdentitySectionProps {
  draft: Omit<AiCharacter, 'id'>
  greeting: string
  onUpdate: (patch: Partial<AiCharacter>) => void
  setGreeting: (v: string) => void
  avatarRef: React.RefObject<HTMLInputElement>
}

const CreateIdentitySection = ({ draft, greeting, onUpdate, setGreeting, avatarRef }: CreateIdentitySectionProps) => {
  const { t } = useTranslation('profile')
  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="flex gap-8 items-start">
        {/* Avatar */}
        <div className="shrink-0 relative pb-5">
          <div className="relative w-20 h-20 rounded-full bg-[linear-gradient(135deg,#d97706,#78350f)] flex items-center justify-center overflow-visible">
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center bg-(--bg-surface) border border-(--border) rounded-full text-(--text-muted) cursor-pointer transition-[background,color] duration-200 ease shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] hover:text-(--text-primary) [&>svg]:w-[14px] [&>svg]:h-[14px]"
              onClick={() => avatarRef.current?.click()}
              aria-label={t('create.backAriaLabel')}
            >
              <PencilIcon />
            </button>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) e.target.value = ''
            }}
          />
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0">
          <div className="mb-7">
            <label className={labelCls} htmlFor="create-name">{t('create.field.name')}</label>
            <input id="create-name" className={inputCls} placeholder={t('create.field.namePlaceholder')} value={draft.name} onChange={(e) => onUpdate({ name: e.target.value.slice(0, 20) })} maxLength={20} />
            <div className="flex justify-end mt-1 text-[0.75rem] text-(--text-muted)">{draft.name.length}/20</div>
          </div>

          <div className="mb-7">
            <label className={labelCls} htmlFor="create-slug">{t('create.field.slug')}</label>
            <input id="create-slug" className={inputCls} placeholder={t('create.field.slugPlaceholder')} value={draft.slug} onChange={(e) => onUpdate({ slug: e.target.value.slice(0, 50) })} maxLength={50} />
            <div className="flex justify-end mt-1 text-[0.75rem] text-(--text-muted)">{draft.slug.length}/50</div>
          </div>

          <div className="mb-7">
            <label className={labelCls} htmlFor="create-personality">{t('create.field.description')}</label>
            <textarea id="create-personality" className={textareaCls} placeholder={t('create.field.descriptionPlaceholder')} value={draft.personality} onChange={(e) => onUpdate({ personality: e.target.value.slice(0, 500) })} maxLength={500} />
            <div className="flex justify-end mt-1 text-[0.75rem] text-(--text-muted)">{draft.personality.length}/500</div>
          </div>

          <div className="mb-7">
            <label className={labelCls} htmlFor="create-greeting">{t('create.field.greeting')}</label>
            <textarea id="create-greeting" className={textareaCls} placeholder={t('create.field.greetingPlaceholder')} value={greeting} onChange={(e) => setGreeting(e.target.value.slice(0, 500))} maxLength={500} />
            <div className="flex justify-end mt-1 text-[0.75rem] text-(--text-muted)">{greeting.length}/500</div>
          </div>

          <div className="mb-7">
            <label className={labelCls} htmlFor="create-phrases">{t('create.field.keyPhrases')}</label>
            <input id="create-phrases" className={inputCls} placeholder={t('create.field.keyPhrasesPlaceholder')} value={draft.appearance.keyPhrases.join(', ')} onChange={(e) => onUpdate({ appearance: { ...draft.appearance, keyPhrases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCharacterForm
