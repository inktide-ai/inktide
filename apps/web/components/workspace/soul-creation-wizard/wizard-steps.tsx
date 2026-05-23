'use client'
import { Atom, Connector, Microphone, User } from '@/components/icons'

export interface WizardStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

export const STEPS: WizardStep[] = [
  { id: 'llm',         title: 'Выберите LLM',               subtitle: 'Выберите языковую модель, которая будет мозгом вашей души.',  icon: <Atom size={18} /> },
  { id: 'tts',         title: 'Выберите TTS провайдер',      subtitle: 'Голос вашей души — выберите сервис озвучки.',                 icon: <Microphone size={18} /> },
  { id: 'channels',    title: 'Каналы и коннекторы',         subtitle: 'Подключите платформы и расширьте возможности.',               icon: <Connector size={18} /> },
  { id: 'personality', title: 'Личность и поведение',        subtitle: 'Определите характер, стиль общения и эмоции.',                icon: <User size={18} /> },
  { id: 'finish',      title: 'Завершение и создание',       subtitle: 'Проверьте настройки и создайте свою душу.',                   icon: <Atom size={18} /> },
]
