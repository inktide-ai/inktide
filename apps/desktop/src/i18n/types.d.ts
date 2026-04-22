import 'i18next'

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
      integrations: typeof import('../../public/locales/en/integrations.json')
      obs: typeof import('../../public/locales/en/obs.json')
      scene: typeof import('../../public/locales/en/scene.json')
      backup: typeof import('../../public/locales/en/backup.json')
      landing: typeof import('../../public/locales/en/landing.json')
    }
  }
}
