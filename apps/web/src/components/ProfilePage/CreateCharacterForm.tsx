import { useRef, useState } from 'react'
import styles from './ProfilePage.module.css'
import type { AiCharacter } from '../../domain/character'
import { IconUser, IconSkills, IconPaint, IconScene, IconMemory, IconBrain, IconMicrophone } from './TabIcons'
import SkillsTab from './tabs/SkillsTab'
import ModelTab from './tabs/ModelTab'
import SceneTab from './tabs/SceneTab'
import MemoryTab from './tabs/MemoryTab'
import BrainTab from './tabs/BrainTab'
import VoiceTab from './tabs/VoiceTab'

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

type CreateTabId = 'profile' | 'skills' | 'avatars' | 'scene' | 'memory' | 'brain' | 'voice'

const CREATE_TABS: { id: CreateTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <IconUser /> },
  { id: 'skills', label: 'Skills', icon: <IconSkills /> },
  { id: 'avatars', label: 'Avatars', icon: <IconPaint /> },
  { id: 'scene', label: 'Scene', icon: <IconScene /> },
  { id: 'memory', label: 'Memory', icon: <IconMemory /> },
  { id: 'brain', label: 'Brain', icon: <IconBrain /> },
  { id: 'voice', label: 'Voice', icon: <IconMicrophone /> },
]

interface CreateCharacterFormProps {
  onSave: (c: Omit<AiCharacter, 'id'>) => void
  onCancel: () => void
  defaultValues: Omit<AiCharacter, 'id'>
}

const CreateCharacterForm = ({ onSave, onCancel, defaultValues }: CreateCharacterFormProps) => {
  const [draft, setDraft] = useState(defaultValues)
  const [greeting, setGreeting] = useState('')
  const [activeTab, setActiveTab] = useState<CreateTabId>('profile')
  const avatarRef = useRef<HTMLInputElement>(null)

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
    <div className={styles.createFormRoot}>
      <div className={styles.createFormTopBar}>
        <div className={styles.createFormTopLeft}>
          <button type="button" className={styles.createFormBack} onClick={onCancel} aria-label="Back">
            <BackIcon />
          </button>
          <nav className={styles.createFormTabs}>
            {CREATE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.createFormTab} ${activeTab === t.id ? styles.createFormTabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className={styles.createFormTabIcon}>{t.icon}</span>
                <span className={styles.createFormTabLabel}>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button type="button" className={styles.createFormSubmitBtn} onClick={handleSave}>
          <PlusIcon />
          <span>Create new</span>
        </button>
      </div>

      <div className={styles.createFormContent}>
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

const CreateIdentitySection = ({ draft, greeting, onUpdate, setGreeting, avatarRef }: CreateIdentitySectionProps) => (
  <div className={styles.tabRoot}>
    <div className={styles.createFormBody}>
      <div className={styles.createFormAvatarWrap}>
        <div className={styles.createFormAvatar}>
          <button
            type="button"
            className={styles.createFormAvatarEdit}
            onClick={() => avatarRef.current?.click()}
            aria-label="Edit avatar"
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

      <div className={styles.createFormFields}>
        <div className={styles.createFormField}>
          <label className={styles.label} htmlFor="create-name">Character name</label>
          <input
            id="create-name"
            className={styles.input}
            placeholder="e.g. Albert Einstein"
            value={draft.name}
            onChange={(e) => onUpdate({ name: e.target.value.slice(0, 20) })}
            maxLength={20}
          />
          <div className={styles.createFormCounter}>{draft.name.length}/20</div>
        </div>

        <div className={styles.createFormField}>
          <label className={styles.label} htmlFor="create-slug">Slug</label>
          <input
            id="create-slug"
            className={styles.input}
            placeholder="url-safe-name"
            value={draft.slug}
            onChange={(e) => onUpdate({ slug: e.target.value.slice(0, 50) })}
            maxLength={50}
          />
          <div className={styles.createFormCounter}>{draft.slug.length}/50</div>
        </div>

        <div className={styles.createFormField}>
          <label className={styles.label} htmlFor="create-personality">Description</label>
          <textarea
            id="create-personality"
            className={styles.textarea}
            placeholder="How would your character describe themselves?"
            value={draft.personality}
            onChange={(e) => onUpdate({ personality: e.target.value.slice(0, 500) })}
            maxLength={500}
          />
          <div className={styles.createFormCounter}>{draft.personality.length}/500</div>
        </div>

        <div className={styles.createFormField}>
          <label className={styles.label} htmlFor="create-greeting">Greeting</label>
          <textarea
            id="create-greeting"
            className={styles.textarea}
            placeholder="A neighbor just knocked. Says his power was cut... but why won't he leave?"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value.slice(0, 500))}
            maxLength={500}
          />
          <div className={styles.createFormCounter}>{greeting.length}/500</div>
        </div>

        <div className={styles.createFormField}>
          <label className={styles.label} htmlFor="create-phrases">Key phrases</label>
          <input
            id="create-phrases"
            className={styles.input}
            placeholder="hey chat, poggers, gg"
            value={draft.appearance.keyPhrases}
            onChange={(e) => onUpdate({ appearance: { ...draft.appearance, keyPhrases: e.target.value } })}
          />
        </div>
      </div>
    </div>
  </div>
)

export default CreateCharacterForm
