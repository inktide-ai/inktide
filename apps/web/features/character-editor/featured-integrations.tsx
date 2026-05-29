import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Data ──────────────────────────────────────────────────────────────────────

interface FeaturedItem {
  benefit: string
  providerId: string
  name: string
  description: string
  iconSrc: string
  darkIcon?: boolean
}

const BRAIN_FEATURED: FeaturedItem[] = [
  {
    benefit: 'Most Popular',
    providerId: 'openai',
    name: 'OpenAI',
    description: 'The most widely used AI platform. Powers GPT-4o and supports OpenAI-compatible endpoints.',
    iconSrc: '/images/providers/brain/chatgpt.svg',
  },
  {
    benefit: 'Recommended',
    providerId: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models by Anthropic. Known for safety, reasoning, and long-context performance.',
    iconSrc: '/images/providers/brain/anthropic.svg',
  },
  {
    benefit: 'Multimodal',
    providerId: 'gemini',
    name: 'Google Gemini',
    description: "Google's multimodal AI. Supports text, images, audio, and video natively.",
    iconSrc: '/images/providers/brain/gemini.webp',
  },
  {
    benefit: 'Open Weights',
    providerId: 'deepseek',
    name: 'DeepSeek',
    description: 'Open-weight frontier models with competitive performance at a fraction of the cost.',
    iconSrc: '/images/providers/brain/deepseek.svg',
  },
]

const VOICE_FEATURED: FeaturedItem[] = [
  {
    benefit: 'Voice Cloning',
    providerId: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'High-quality neural TTS with voice cloning and support for 30+ languages.',
    iconSrc: '/images/providers/voice/elevenlabs.svg',
  },
  {
    benefit: 'Natural Voices',
    providerId: 'openai',
    name: 'OpenAI',
    description: "Natural-sounding voices from OpenAI's text-to-speech API with multiple voice options.",
    iconSrc: '/images/providers/voice/chatgpt.svg',
  },
  {
    benefit: 'Low Latency',
    providerId: 'cartesia',
    name: 'Cartesia',
    description: 'Real-time speech synthesis with ultra-low latency for interactive applications.',
    iconSrc: '/images/providers/voice/cartesia.svg',
  },
  {
    benefit: 'Open Source',
    providerId: 'kokoro',
    name: 'Kokoro',
    description: 'Open-source TTS with high-quality output that runs fully on local hardware.',
    iconSrc: '/images/providers/voice/kokoro.svg',
  },
]

// ── Card ──────────────────────────────────────────────────────────────────────

function IntegrationCard({ benefit, name, description, iconSrc, darkIcon, href }: FeaturedItem & { href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 transition-colors hover:bg-[var(--surface-2)]"
    >
      <span className="inline-flex self-start rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2 py-0.5 text-caption font-medium text-[var(--text-secondary)]">
        {benefit}
      </span>
      <div className="flex flex-1 items-center justify-center py-6">
        <div className={cn(
          'flex h-14 w-14 items-center justify-center overflow-hidden rounded-[10px]',
          darkIcon && 'bg-white p-2',
        )}>
          <img
            src={iconSrc}
            alt={name}
            className={cn('object-contain', darkIcon ? 'h-full w-full' : 'h-14 w-14 rounded-[10px]')}
            draggable={false}
          />
        </div>
      </div>
      <div>
        <p className="text-body-md font-semibold text-[var(--text-primary)]">{name}</p>
        <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{description}</p>
      </div>
    </Link>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function FeaturedIntegrations({ baseHref, type }: { baseHref: string; type: 'brain' | 'voice' }) {
  const integrations = type === 'brain' ? BRAIN_FEATURED : VOICE_FEATURED
  return (
    <section className="mb-10 mt-10">
      <h2 className="text-[1.0625rem] font-semibold text-[var(--text-heading)]">Featured</h2>
      <p className="mt-0.5 text-body text-[var(--text-secondary)]">
        A selection of integrations curated by our marketplace team.
      </p>
      <div className="mt-5 grid grid-cols-4 gap-6">
        {integrations.map((item) => (
          <IntegrationCard
            key={item.providerId}
            {...item}
            href={`${baseHref}/${item.providerId}`}
          />
        ))}
      </div>
    </section>
  )
}
