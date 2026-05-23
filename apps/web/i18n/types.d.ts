import 'i18next'

// Declare resource types from the English (source-of-truth) locale files.
// This gives TypeScript autocomplete and type-checking for all t() calls.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof import('../../public/locales/en/common.json')
      behavior: typeof import('../../public/locales/en/behavior.json')
      profile: typeof import('../../public/locales/en/profile.json')
      voice: typeof import('../../public/locales/en/voice.json')
      brain: typeof import('../../public/locales/en/brain.json')
      model: typeof import('../../public/locales/en/model.json')
      prompts: typeof import('../../public/locales/en/prompts.json')
      channels: typeof import('../../public/locales/en/channels.json')
      scenes: typeof import('../../public/locales/en/scenes.json')
      obs: typeof import('../../public/locales/en/obs.json')
      scene: typeof import('../../public/locales/en/scene.json')
      backup: typeof import('../../public/locales/en/backup.json')
      landing: typeof import('../../public/locales/en/landing.json')
      providers: typeof import('../../public/locales/en/providers.json')
    }
  }
}
