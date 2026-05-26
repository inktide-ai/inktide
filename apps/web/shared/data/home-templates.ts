export type HomeTemplateIcon = 'twitch' | 'bot' | 'radio' | 'mic' | 'siren'

export interface HomeTemplate {
  id: string
  title: string
  subtitle: string
  icon: HomeTemplateIcon
}

export const HOME_TEMPLATES: HomeTemplate[] = [
  { id: '1', title: 'Twitch Chat Bot',   subtitle: 'Ready to use', icon: 'twitch' },
  { id: '2', title: 'Discord Assistant', subtitle: 'Ready to use', icon: 'bot'    },
  { id: '3', title: 'AI VTuber',         subtitle: 'Ready to use', icon: 'radio'  },
  { id: '4', title: 'Voice Assistant',   subtitle: 'Ready to use', icon: 'mic'    },
  { id: '5', title: 'Alert System',      subtitle: 'Ready to use', icon: 'siren'  },
]
