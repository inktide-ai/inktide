import { getTranslations } from '@/lib/i18n-server'
import { sectionContainer } from './section-container'

const LLM_MODELS = [
  { name: 'Gemini',   url: 'https://ai.google.dev',    logo: '/images/partners/gemini.svg',   style: { marginBottom: '10px' } },
  { name: 'Grok',     url: 'https://x.ai',             logo: '/images/partners/grok.svg' },
  { name: 'DeepSeek', url: 'https://www.deepseek.com', logo: '/images/partners/deepseek.svg' },
]

export default async function PartnerLogos() {
  const t = await getTranslations('landing')

  return (
    <section className="w-full py-4 bg-[var(--bg-dark)]">
      <div className={[
        sectionContainer,
        'grid grid-cols-1 gap-5',
        'lg:grid-cols-[160px_1fr] lg:items-center',
      ].join(' ')}>

        <div className="flex-shrink-0">
          <h6 className="font-[family-name:var(--font-heading)] text-[0.9rem] font-medium text-[var(--text-muted)] m-0 leading-[1.3]">
            {t('partners.heading')}
          </h6>
        </div>

        <div
          className="overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div className="flex items-center w-max animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused]">
            {[...LLM_MODELS, ...LLM_MODELS].map((model, i) => (
              <a
                key={`${model.name}-${i}`}
                href={model.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 px-5 flex items-center justify-center min-h-[52px] no-underline"
                aria-label={model.name}
              >
                <img
                  src={model.logo}
                  alt=""
                  className="h-[52px] w-auto object-contain block rounded-[4px] opacity-80 transition-opacity duration-[200ms] group-hover:opacity-100"
                  style={model.style}
                  loading={i < LLM_MODELS.length ? 'eager' : 'lazy'}
                />
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
