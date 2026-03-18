import { useState } from 'react'
import styles from '../ProfilePage.module.css'

interface AiCharacter {
  id: string
  name: string
  slug: string
  personality: string
  avatarUrl?: string
  isActive: boolean
}

const DEMO_CHARACTERS: AiCharacter[] = [
  {
    id: '1',
    name: 'Luna',
    slug: 'luna',
    personality: 'Friendly and witty AI companion who loves gaming culture and memes',
    isActive: true,
  },
]

const CharactersTab = () => {
  const [characters, setCharacters] = useState<AiCharacter[]>(DEMO_CHARACTERS)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', slug: '', personality: '' })

  const startCreate = () => {
    setEditing('__new__')
    setDraft({ name: '', slug: '', personality: '' })
  }

  const startEdit = (c: AiCharacter) => {
    setEditing(c.id)
    setDraft({ name: c.name, slug: c.slug, personality: c.personality })
  }

  const save = () => {
    if (!draft.name.trim()) return
    if (editing === '__new__') {
      setCharacters((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: draft.name,
          slug: draft.slug || draft.name.toLowerCase().replace(/\s+/g, '-'),
          personality: draft.personality,
          isActive: false,
        },
      ])
    } else {
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === editing ? { ...c, name: draft.name, slug: draft.slug, personality: draft.personality } : c
        )
      )
    }
    setEditing(null)
  }

  const toggleActive = (id: string) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)))
  }

  const remove = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }

  if (editing !== null) {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ marginBottom: '1.25rem' }}>
          {editing === '__new__' ? 'New Character' : 'Edit Character'}
        </h3>
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            placeholder="e.g. Luna, Nyx, Spark..."
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Slug</label>
          <input
            className={styles.input}
            placeholder="url-safe-name"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Personality</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe your AI's personality in a few sentences..."
            value={draft.personality}
            onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className={styles.btnPrimary} onClick={save}>
            Save Character
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <button type="button" className={styles.btnPrimary} onClick={startCreate}>
          + New Character
        </button>
      </div>

      {characters.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <div className={styles.emptyTitle}>No characters yet</div>
          <p className={styles.emptyText}>
            Create your first AI character to get started. Give it a name, personality, and watch it come alive on stream.
          </p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {characters.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', borderRadius: '0.625rem', objectFit: 'cover' }} />
                  ) : (
                    c.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className={styles.cardTitle}>{c.name}</div>
                  <div className={styles.cardDescription}>/{c.slug}</div>
                </div>
                {c.isActive && <span className={styles.navBadge}>ACTIVE</span>}
              </div>
              <p className={styles.cardDescription} style={{ marginBottom: '1rem' }}>
                {c.personality}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className={styles.btnPrimary} onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => toggleActive(c.id)}
                >
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => remove(c.id)}
                  style={{ color: 'var(--accent-red)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default CharactersTab
