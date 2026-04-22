import { CONTENT } from '../../constants'
import styles from './PartnerLogos.module.css'
import deepseekLogo from '../../assets/partners/deepseek.svg'
import geminiLogo from '../../assets/partners/gemini.svg'
import grokLogo from '../../assets/partners/grok.svg'

const LLM_MODELS = [
  { name: 'Gemini', url: 'https://ai.google.dev', logo: geminiLogo, style: { marginBottom: '10px' } },
  { name: 'Grok', url: 'https://x.ai', logo: grokLogo },
  { name: 'DeepSeek', url: 'https://www.deepseek.com', logo: deepseekLogo },
]

const PartnerLogos = () => (
  <section className={styles.section}>
    <div className={styles.container}>
      <div className={styles.textContent}>
        <h6 className={styles.heading}>{CONTENT.partners.heading}</h6>
      </div>
      <div className={styles.marqueeWrapper}>
        <div className={styles.marquee}>
          {[...LLM_MODELS, ...LLM_MODELS].map((model, i) => (
            <a
              key={`${model.name}-${i}`}
              href={model.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.marqueeItem}
              aria-label={model.name}
            >
              <img
                src={model.logo}
                alt=""
                className={styles.logoImg}
                style={model.style}
                loading={i < LLM_MODELS.length ? 'eager' : 'lazy'}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export default PartnerLogos
