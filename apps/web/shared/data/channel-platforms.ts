export type PanelTheme = 'discord' | 'twitch' | 'kick' | 'vk' | 'telegram'

export interface ChannelStaticConfig {
  theme: PanelTheme
  bg: string
  fg: string
  addBtn: string
  validateChannelId: (v: string) => boolean
  hintLink?: string
}

export const CHANNEL_STATIC: Record<string, ChannelStaticConfig> = {
  discord:  { theme: 'discord',  bg: 'rgba(88,101,242,0.15)',  fg: '#5865f2', addBtn: 'bg-[#5865f2] hover:bg-[#4752c4] text-white',  validateChannelId: (v) => /^\d{17,20}$/.test(v.trim()) },
  twitch:   { theme: 'twitch',   bg: 'rgba(145,70,255,0.15)', fg: 'var(--platform-twitch)', addBtn: 'bg-[var(--platform-twitch)] hover:bg-[#7d34e6] text-white',  validateChannelId: (v) => /^[a-zA-Z0-9_\-]{1,100}$/.test(v.trim()) },
  kick:     { theme: 'kick',     bg: 'rgba(83,252,24,0.12)',  fg: '#2ecc00', addBtn: 'bg-[#3fb800] hover:bg-[#309200] text-white',  validateChannelId: (v) => /^[a-zA-Z0-9_\-]{1,100}$/.test(v.trim()) },
  vk_video: { theme: 'vk',       bg: 'rgba(0,119,255,0.15)',  fg: '#0077ff', addBtn: 'bg-[#0077ff] hover:bg-[#005bcc] text-white',  validateChannelId: (v) => /^[a-zA-Z0-9_\-]{1,100}$/.test(v.trim()) },
  telegram: { theme: 'telegram', bg: 'rgba(0,136,204,0.12)',  fg: '#0088cc', addBtn: 'bg-[#0088cc] hover:bg-[#006ba3] text-white',  validateChannelId: (v) => /^[a-zA-Z0-9_\-]{1,200}$/.test(v.trim()) },
}

export const CHANNEL_VALID_IDS = Object.keys(CHANNEL_STATIC)

export interface ChannelPlatformDetails {
  developer: string
  website: string
  docsUrl: string
  termsUrl: string
  privacyUrl: string
  supportUrl: string
}

export const CHANNEL_DETAILS: Record<string, ChannelPlatformDetails> = {
  discord: {
    developer:  'Discord Inc.',
    website:    'discord.com',
    docsUrl:    'https://discord.com/developers/docs',
    termsUrl:   'https://discord.com/terms',
    privacyUrl: 'https://discord.com/privacy',
    supportUrl: 'https://support.discord.com',
  },
  telegram: {
    developer:  'Telegram FZ-LLC',
    website:    'telegram.org',
    docsUrl:    'https://core.telegram.org/bots',
    termsUrl:   'https://telegram.org/tos',
    privacyUrl: 'https://telegram.org/privacy',
    supportUrl: 'https://telegram.org/support',
  },
  twitch: {
    developer:  'Twitch Interactive, Inc.',
    website:    'twitch.tv',
    docsUrl:    'https://dev.twitch.tv/docs',
    termsUrl:   'https://www.twitch.tv/p/legal/terms-of-service',
    privacyUrl: 'https://www.twitch.tv/p/legal/privacy-notice',
    supportUrl: 'https://help.twitch.tv',
  },
  kick: {
    developer:  'Kick Streaming Pty Ltd',
    website:    'kick.com',
    docsUrl:    'https://docs.kick.com',
    termsUrl:   'https://kick.com/terms-of-service',
    privacyUrl: 'https://kick.com/privacy-policy',
    supportUrl: 'https://help.kick.com',
  },
  vk_video: {
    developer:  'VK',
    website:    'vk.com',
    docsUrl:    'https://dev.vk.com',
    termsUrl:   'https://vk.com/terms',
    privacyUrl: 'https://vk.com/privacy',
    supportUrl: 'https://vk.com/support',
  },
}
