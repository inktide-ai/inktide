'use client'
import { useClipboard } from '@/shared/hooks/useClipboard'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getCard, type ChannelResponse } from '@/features/soul/api/index' // fsd:cross-feature-ok - soul editor
// fsd:cross-feature-ok - renderer composition in soul editor
import { useCardModel, useCardScene } from '@/entities/soul/hooks'
import type { AiCharacter } from '@/shared/lib/character'
import { buildObsSceneUrl } from '@/shared/lib/utils/obs-url'

const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionTitle = 'text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2'

interface ObsTabProps {
  character: AiCharacter
  cardId: string
}

function CheckItem({ ok, label, okSub, warnSub }: { ok: boolean; label: string; okSub: string; warnSub: string }) {
  return (
    <div className="flex items-start gap-[14px] p-[14px_16px] bg-white/[0.03] border border-white/[0.06] rounded-[10px]">
      <span className={cn('w-[9px] h-[9px] rounded-full shrink-0 mt-[5px]', ok ? 'bg-[var(--color-online)] shadow-[0_0_8px_rgba(34,197,94,0.45)]' : 'bg-white/[0.12]')} />
      <div className="flex flex-col gap-[3px]">
        <span className="text-body font-medium text-(--text-primary)">{label}</span>
        {ok
          ? <span className="text-[0.78rem] text-(--text-muted)">{okSub}</span>
          : <span className="text-[0.78rem] text-[rgba(251,191,36,0.75)]">{warnSub}</span>}
      </div>
    </div>
  )
}

export default function ObsTab({ character, cardId }: ObsTabProps) {
  const { t } = useTranslation('obs')
  const { model, loading: modelLoading } = useCardModel(cardId)
  const { scene, loading: sceneLoading } = useCardScene(cardId)

  const [channels, setChannels] = useState<ChannelResponse[] | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const { copied, copy: copyUrl } = useClipboard()

  useEffect(() => {
    let cancelled = false
    getCard(cardId)
      .then((card) => {
        if (cancelled) return
        const active = (card.channels ?? []).filter((c) => c.is_active && c.channel_id)
        setChannels(active)
        if (active.length > 0) setSelectedChannelId(active[0].channel_id)
      })
      .catch(() => { if (!cancelled) setChannels([]) })
    return () => { cancelled = true }
  }, [cardId])

  const hasModel = !!model && character.appearance.modelType !== 'none'
  const hasChannel = !!channels?.length && !!selectedChannelId
  const loading = modelLoading || sceneLoading || channels === null

  const obsUrl = useMemo(() => {
    if (!hasModel || !hasChannel) return null
    return buildObsSceneUrl(window.location.origin, {
      channelId: selectedChannelId!,
      modelUrl:  model!.public_url,
      modelType: character.appearance.modelType,
      sceneUrl:  scene?.public_url,
    })
  }, [hasModel, hasChannel, selectedChannelId, model, scene, character.appearance.modelType])

  function handleCopyUrl() {
    if (!obsUrl) return
    copyUrl(obsUrl)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.title')}</div>
        <p className="text-body text-(--text-muted) m-0 leading-relaxed">{t('intro')}</p>
      </div>

      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.requirements')}</div>
        <div className="flex flex-col gap-2">
          <CheckItem ok={hasModel} label={t('requirements.model.label')} okSub={`${character.appearance.modelType.toUpperCase()} · ${model?.original_file_name ?? ''}`} warnSub={t('requirements.model.warn')} />
          <CheckItem ok={hasChannel} label={t('requirements.channel.label')} okSub={`${channels?.length ?? 0} active channel${(channels?.length ?? 0) !== 1 ? 's' : ''}`} warnSub={t('requirements.channel.warn')} />
        </div>
      </div>

      {channels && channels.length > 1 && (
        <div className={sectionCls}>
          <div className={sectionTitle}>{t('section.channel')}</div>
          <div className="flex flex-col gap-2 p-4">
            <label className="text-[0.8rem] text-(--text-muted) font-medium" htmlFor="obs-channel-select">{t('channelSelect')}</label>
            <select
              id="obs-channel-select"
              className="w-full py-2 px-3 bg-white/[0.05] border border-white/10 rounded-[8px] text-(--text-primary) text-body cursor-pointer outline-none appearance-none focus:border-white/22"
              value={selectedChannelId ?? ''}
              onChange={(e) => setSelectedChannelId(e.target.value || null)}
            >
              {channels.map((ch) => (
                <option key={ch.id} value={ch.channel_id ?? ''}>{ch.platform} · {ch.channel_name} ({ch.channel_id})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.browserUrl')}</div>
        <div className="bg-black/45 border border-white/[0.08] rounded-xl overflow-hidden">
          {obsUrl ? (
            <>
              <div className="p-[14px_16px] border-b border-white/[0.06] overflow-x-auto">
                <code className="font-mono text-[0.78rem] text-[#a5f3fc] whitespace-nowrap select-all">{obsUrl}</code>
              </div>
              <div className="flex items-center gap-[10px] p-[11px_16px]">
                <button type="button" className={cn('py-[6px] px-4 bg-white/[0.08] border border-white/[0.13] rounded-[7px] text-(--text-primary) text-[0.82rem] font-medium cursor-pointer transition-[background,border-color,color] duration-[120ms] hover:bg-white/[0.14] hover:border-white/22', copied && 'bg-[var(--color-online)]/12 border-[var(--color-online)]/28 text-[var(--color-online)]')} onClick={handleCopyUrl}>
                  {copied ? t('url.copied') : t('url.copy')}
                </button>
                <a className="text-[0.82rem] text-[rgba(165,243,252,0.7)] no-underline py-[6px] px-[14px] rounded-[7px] border border-[rgba(165,243,252,0.13)] transition-[color,border-color] duration-[120ms] hover:text-[#a5f3fc] hover:border-[rgba(165,243,252,0.28)]" href={obsUrl} target="_blank" rel="noreferrer">
                  {t('url.preview')}
                </a>
              </div>
            </>
          ) : (
            <div className="p-[22px_16px] text-[0.85rem] text-(--text-muted) text-center">
              {loading ? t('url.loading') : t('url.incomplete')}
            </div>
          )}
        </div>
      </div>

      <div className={sectionCls}>
        <div className={sectionTitle}>{t('section.setup')}</div>
        <div className="flex flex-col">
          {[
            { n: 1, title: t('steps.1.title'), desc: t('steps.1.desc'), code: null },
            { n: 2, title: t('steps.2.title'), desc: t('steps.2.desc'), code: null },
            { n: 3, title: t('steps.3.title'), desc: t('steps.3.desc'), code: 'body { margin: 0; background: transparent; }' },
          ].map(({ n, title, desc, code }) => (
            <div key={n} className="flex items-start gap-4 p-[14px_12px] rounded-[10px] transition-[background] duration-100 hover:bg-white/[0.02]">
              <span className="w-[26px] h-[26px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-semibold text-(--text-muted) shrink-0">{n}</span>
              <div className="flex flex-col gap-[5px] pt-[2px]">
                <div className="text-body font-medium text-(--text-primary)">{title}</div>
                <div className="text-[0.82rem] text-(--text-muted) leading-[1.55]">{desc}</div>
                {code && <code className="inline-block mt-[9px] py-[7px] px-[11px] bg-black/45 border border-white/[0.07] rounded-[7px] font-mono text-[0.77rem] text-[#a5f3fc] select-all">{code}</code>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
