import { useState } from 'react'
import styles from '../ProfilePage.module.css'

const DEFAULT_SYSTEM_PROMPT = `You are a friendly AI companion on a live stream. You interact with chat, react to events, and entertain viewers. Keep responses concise and engaging. Use humor when appropriate.`

const PromptsTab = () => {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [personality, setPersonality] = useState(
    'Witty, energetic, and supportive. Loves gaming culture and internet humor.'
  )

  return (
    <div className={styles.cardsGrid}>
      <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>💬</div>
          <div>
            <div className={styles.cardTitle}>System Prompt</div>
            <div className={styles.cardDescription}>
              The core instructions that define how your AI behaves
            </div>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>System Prompt</label>
          <textarea
            className={styles.textareaLarge}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are..."
          />
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          {systemPrompt.length} characters · This prompt is sent at the start of every conversation
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>🎭</div>
          <div>
            <div className={styles.cardTitle}>Personality</div>
            <div className={styles.cardDescription}>Short description of your AI's character</div>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Personality</label>
          <textarea
            className={styles.textarea}
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Describe the personality..."
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconGold}`}>💡</div>
          <div>
            <div className={styles.cardTitle}>Tips</div>
            <div className={styles.cardDescription}>Best practices for prompts</div>
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'Be specific about tone — "sarcastic but kind" works better than "funny"',
            'Set boundaries — tell the AI what NOT to do',
            'Include context about your stream and community',
            'Test with real chat messages and iterate',
          ].map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-gold)', flexShrink: 0 }}>→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PromptsTab
