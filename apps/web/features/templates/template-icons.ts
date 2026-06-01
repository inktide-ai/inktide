import { type LucideIcon, Tv, Bot, Star, Mic, Bell, FileText } from 'lucide-react'

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'twitch-bot':        Tv,
  'discord-assistant': Bot,
  'ai-vtuber':         Star,
  'voice-assistant':   Mic,
  'alert-system':      Bell,
  'blank':             FileText,
}
