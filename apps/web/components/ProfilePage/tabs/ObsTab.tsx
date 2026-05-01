'use client'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCard, type ChannelResponse } from '../../../api/soul'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { useCardScene } from '../../AvatarRenderer/hooks/useCardScene'
import pageStyles from '../ProfilePage.module.css'
import styles from './ObsTab.module.css'
import type { AiCharacter } from '@/lib/character'

interface ObsTabProps {
  character: AiCharacter
  cardId: string
}

// ── Checklist item ────────────────────────────────────────────────────────────

function CheckItem({
  ok,
  label,
  okSub,
  warnSub,
}: {
  ok: boolean
  label: string
  okSub: string
  warnSub: string
}) {
  return (
    <div className={styles.checkItem}>
      <span className={`${styles.checkDot} ${ok ? styles.checkDotOk : styles.checkDotMissing}`} />
      <div className={styles.checkText}>
        <span className={styles.checkLabel}>{label}</span>
        {ok ? (
          <span className={styles.checkSub}>{okSub}</span>
        ) : (
          <span className={styles.checkSubWarn}>{warnSub}</span>
        )}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ObsTab({ character, cardId }: ObsTabProps) {
  const { t } = useTranslation('obs')
  const { model, loading: modelLoading } = useCardModel(cardId)
  const { scene, loading: sceneLoading } = useCardScene(cardId)

  const [channels, setChannels] = useState<ChannelResponse[] | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCard(cardId)
      .then((card) => {
        if (cancelled) return
        const active = (card.channels ?? []).filter((c) => c.is_active && c.channel_id)
        setChannels(active)
        if (active.length > 0) setSelectedChannelId(active[0].channel_id)
      })
      .catch(() => {
        if (!cancelled) setChannels([])
      })
    return () => {
      cancelled = true
    }
  }, [cardId])

  const hasModel = !!model && character.appearance.modelType !== 'none'
  const hasChannel = !!channels?.length && !!selectedChannelId
  const loading = modelLoading || sceneLoading || channels === null

  const obsUrl = useMemo(() => {
    if (!hasModel || !hasChannel) return null
    const params = new URLSearchParams({
      channelId: selectedChannelId!,
      modelUrl: model!.public_url,
      modelType: character.appearance.modelType,
    })
    if (scene?.public_url) params.set('sceneUrl', scene.public_url)
    return `${window.location.origin}/obs/scene?${params.toString()}`
  }, [hasModel, hasChannel, selectedChannelId, model, scene, character.appearance.modelType])

  const copyUrl = () => {
    if (!obsUrl) return
    navigator.clipboard.writeText(obsUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={pageStyles.tabRoot}>

      {/* ── Header ── */}
      <div className={pageStyles.section}>
        <div className={pageStyles.sectionTitle}>{t('section.title')}</div>
        <p className={styles.intro}>
          {t('intro')}
        </p>
      </div>

      {/* ── Requirements ── */}
      <div className={pageStyles.section}>
        <div className={pageStyles.sectionTitle}>{t('section.requirements')}</div>
        <div className={styles.checklist}>
          <CheckItem
            ok={hasModel}
            label={t('requirements.model.label')}
            okSub={`${character.appearance.modelType.toUpperCase()} · ${model?.original_file_name ?? ''}`}
            warnSub={t('requirements.model.warn')}
          />
          <CheckItem
            ok={hasChannel}
            label={t('requirements.channel.label')}
            okSub={`${channels?.length ?? 0} active channel${(channels?.length ?? 0) !== 1 ? 's' : ''}`}
            warnSub={t('requirements.channel.warn')}
          />
        </div>
      </div>

      {/* ── Channel selector (only when multiple active channels) ── */}
      {channels && channels.length > 1 && (
        <div className={pageStyles.section}>
          <div className={pageStyles.sectionTitle}>{t('section.channel')}</div>
          <div className={pageStyles.infoCard}>
            <div className={styles.channelSelectWrap}>
              <label className={styles.fieldLabel} htmlFor="obs-channel-select">
                {t('channelSelect')}
              </label>
              <select
                id="obs-channel-select"
                className={styles.select}
                value={selectedChannelId ?? ''}
                onChange={(e) => setSelectedChannelId(e.target.value || null)}
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.channel_id ?? ''}>
                    {ch.platform} · {ch.channel_name} ({ch.channel_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── URL card ── */}
      <div className={pageStyles.section}>
        <div className={pageStyles.sectionTitle}>{t('section.browserUrl')}</div>
        <div className={styles.urlCard}>
          {obsUrl ? (
            <>
              <div className={styles.urlBar}>
                <code className={styles.urlText}>{obsUrl}</code>
              </div>
              <div className={styles.urlActions}>
                <button
                  type="button"
                  className={`${styles.btnCopy} ${copied ? styles.btnCopied : ''}`}
                  onClick={copyUrl}
                >
                  {copied ? t('url.copied') : t('url.copy')}
                </button>
                <a className={styles.btnPreview} href={obsUrl} target="_blank" rel="noreferrer">
                  {t('url.preview')}
                </a>
              </div>
            </>
          ) : (
            <div className={styles.urlPlaceholder}>
              {loading
                ? t('url.loading')
                : t('url.incomplete')}
            </div>
          )}
        </div>
      </div>

      {/* ── Setup guide ── */}
      <div className={pageStyles.section}>
        <div className={pageStyles.sectionTitle}>{t('section.setup')}</div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>{t('steps.1.title')}</div>
              <div className={styles.stepDesc}>
                {t('steps.1.desc')}
              </div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>{t('steps.2.title')}</div>
              <div className={styles.stepDesc}>
                {t('steps.2.desc')}
              </div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>{t('steps.3.title')}</div>
              <div className={styles.stepDesc}>
                {t('steps.3.desc')}
              </div>
              <code className={styles.stepCode}>{'body { margin: 0; background: transparent; }'}</code>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
