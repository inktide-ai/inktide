export type TemplatePlatform = 'twitch' | 'discord' | 'telegram' | 'any'
export type TemplateCategory = 'streaming' | 'assistant' | 'vtuber' | 'utility'

export interface TemplateNextStep {
  id: string
  label: string
  description: string
  hrefTemplate: string
  required: boolean
  doneWhen: 'soul' | 'channel' | 'model' | 'scene' | 'never'
}

export interface ProjectTemplate {
  id: string
  name: string
  emoji: string
  tagline: string
  description: string
  longDescription: string
  accentColor: string
  defaultName: string
  systemPrompt: string
  category: TemplateCategory
  platforms: TemplatePlatform[]
  nextSteps: TemplateNextStep[]
  isSystem: true
  features: string[]
}

export interface UserProjectTemplate extends Omit<ProjectTemplate, 'isSystem'> {
  isSystem: false
  createdAt: string
  updatedAt: string
}

export type AnyProjectTemplate = ProjectTemplate | UserProjectTemplate

export const SYSTEM_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'twitch-bot',
    name: 'Twitch Chat Bot',
    emoji: '🎮',
    tagline: 'Ready to use',
    description: 'AI that reads and responds to Twitch chat in real time',
    longDescription:
      'A chat bot that monitors your Twitch channel, responds to viewer messages with personality, reacts to events like donations and raids, and keeps the energy high during your streams.',
    accentColor: '#9146ff',
    defaultName: 'Twitch Chat Bot',
    category: 'streaming',
    platforms: ['twitch'],
    features: [
      'Real-time chat responses',
      'Donation & raid reactions',
      'Viewer engagement',
      'Stream-aware personality',
    ],
    systemPrompt: `You are a charismatic and energetic Twitch chat bot. Your role is to:
- Respond to chat messages with personality and enthusiasm
- React to stream events (donations, raids, subscriptions) with appropriate excitement
- Keep responses SHORT — under 40 words per message
- Use Twitch culture naturally (PogChamp, LUL, HypeE, etc.) but don't overdo it
- Match the energy of the stream
- Never break character or mention being an AI unless directly asked
- Prioritize the most recent and engaging messages
- Be positive, supportive, and entertaining`,
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'A Soul is the AI personality that will power your bot',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'connect-twitch',
        label: 'Connect Twitch channel',
        description: 'Link your Twitch channel so the bot can read chat',
        hrefTemplate: '/souls/{soulId}/channels/twitch',
        required: true,
        doneWhen: 'channel',
      },
      {
        id: 'upload-model',
        label: 'Add a 3D avatar (optional)',
        description: 'Upload a VRM model for OBS rendering',
        hrefTemplate: '/projects/{projectId}/scene',
        required: false,
        doneWhen: 'model',
      },
    ],
    isSystem: true,
  },
  {
    id: 'discord-assistant',
    name: 'Discord Assistant',
    emoji: '💬',
    tagline: 'Ready to use',
    description: 'Helpful AI for your Discord community',
    longDescription:
      'An intelligent assistant that answers questions, helps members find resources, and keeps your Discord community engaged and supported around the clock.',
    accentColor: '#5865f2',
    defaultName: 'Discord Assistant',
    category: 'assistant',
    platforms: ['discord'],
    features: [
      'Q&A and knowledge base',
      'Community moderation support',
      'Onboarding new members',
      '24/7 availability',
    ],
    systemPrompt: `You are a helpful and friendly Discord community assistant. Your role is to:
- Answer questions accurately and concisely
- Help members find resources, channels, and information
- Welcome new members warmly
- Maintain a positive, inclusive community atmosphere
- Keep responses clear and to the point (under 150 words unless complex)
- If you don't know something, say so honestly
- Never take sides in arguments — stay neutral and helpful
- Use Discord-appropriate formatting (bold for emphasis, code blocks for code)`,
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'Choose the AI personality for your assistant',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'connect-discord',
        label: 'Connect Discord server',
        description: 'Authorize the bot on your Discord server',
        hrefTemplate: '/souls/{soulId}/channels/discord',
        required: true,
        doneWhen: 'channel',
      },
    ],
    isSystem: true,
  },
  {
    id: 'ai-vtuber',
    name: 'AI VTuber',
    emoji: '🌟',
    tagline: 'Ready to use',
    description: 'A virtual streamer with personality, voice, and live avatar',
    longDescription:
      'Create your own AI VTuber — an animated virtual character that streams live, interacts with chat, shows emotions, and has a consistent unique personality that grows with your audience.',
    accentColor: '#ec4899',
    defaultName: 'My AI VTuber',
    category: 'vtuber',
    platforms: ['any'],
    features: [
      'Live avatar rendering (VRM)',
      'Real-time lip sync',
      'Emotional expressions',
      'Chat interaction',
      'Streamer personality',
    ],
    systemPrompt: `You are a charismatic AI VTuber streaming live. Your personality is:
- Enthusiastic, warm, and genuinely interested in your audience
- You have opinions, preferences, and a consistent character
- React to chat authentically — express joy, surprise, laughter naturally
- Share your thoughts on what's happening in the stream
- Remember regulars and acknowledge returning viewers
- Stay in character at all times — you are the character, not playing one
- Keep responses conversational and under 60 words
- Show emotions through your words: "Wait, WHAT?!", "omg that's hilarious", "I actually love this so much"`,
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'The AI that will be your VTuber character',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'upload-model',
        label: 'Upload a VRM avatar',
        description: 'Your 3D character model for live rendering',
        hrefTemplate: '/projects/{projectId}/scene',
        required: true,
        doneWhen: 'model',
      },
      {
        id: 'connect-channel',
        label: 'Connect streaming platform',
        description: 'Link Twitch, Discord, or another platform',
        hrefTemplate: '/souls/{soulId}/channels/twitch',
        required: false,
        doneWhen: 'channel',
      },
    ],
    isSystem: true,
  },
  {
    id: 'voice-assistant',
    name: 'Voice Assistant',
    emoji: '🎙️',
    tagline: 'Ready to use',
    description: 'A spoken AI assistant with natural voice responses',
    longDescription:
      'A voice-first AI assistant that listens and responds with a natural synthesized voice. Perfect for hands-free interaction, ambient AI presence on stream, or as a voice-enabled chatbot.',
    accentColor: '#0ea5e9',
    defaultName: 'Voice Assistant',
    category: 'assistant',
    platforms: ['any'],
    features: [
      'Natural voice responses (TTS)',
      'Hands-free interaction',
      'Concise spoken answers',
      'Real-time synthesis',
    ],
    systemPrompt: `You are a voice assistant. Your responses will be spoken aloud via text-to-speech.
Rules for voice:
- Keep responses SHORT — 1-2 sentences max for simple queries
- Write naturally spoken language, not written text
- Avoid markdown, bullet points, special characters
- Spell out numbers when reading naturally (twenty-three, not 23)
- Never start with "Certainly!" or "Of course!" — just answer directly
- If asked something complex, give a brief spoken summary then offer to elaborate
- Be helpful, clear, and efficient`,
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'Choose the AI for your assistant',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'setup-voice',
        label: 'Configure voice (TTS)',
        description: 'Set up text-to-speech in Soul → Voice settings',
        hrefTemplate: '/souls/{soulId}/voice',
        required: false,
        doneWhen: 'never',
      },
    ],
    isSystem: true,
  },
  {
    id: 'alert-system',
    name: 'Alert System',
    emoji: '🔔',
    tagline: 'Ready to use',
    description: 'AI that announces stream events with personality',
    longDescription:
      'An alert system that detects stream events — donations, follows, subs, raids — and responds with custom AI-generated announcements that match the mood and energy of your stream.',
    accentColor: '#f59e0b',
    defaultName: 'Alert System',
    category: 'utility',
    platforms: ['twitch', 'discord'],
    features: [
      'Donation announcements',
      'Follow & sub alerts',
      'Raid reactions',
      'Custom event responses',
    ],
    systemPrompt: `You are an alert system AI for a live stream. Your job is to generate enthusiastic, personalized announcements for stream events.

When a donation happens: Thank the donor by name, mention the amount, react with appropriate excitement
When someone follows: Welcome them warmly, keep it brief
When a sub happens: Celebrate the subscription, maybe reference their tier
When a raid happens: Hype up the incoming viewers, welcome them with energy

Style:
- Short bursts of energy (10-30 words)
- Use the viewer's name when available
- Match the donation amount to enthusiasm level
- Never repeat the same phrase twice in a row
- Keep it authentic, not robotic`,
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'The AI that generates your alerts',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'connect-twitch',
        label: 'Connect Twitch channel',
        description: 'Link Twitch to receive event notifications',
        hrefTemplate: '/souls/{soulId}/channels/twitch',
        required: true,
        doneWhen: 'channel',
      },
    ],
    isSystem: true,
  },
  {
    id: 'blank',
    name: 'Blank Project',
    emoji: '📄',
    tagline: 'Start from scratch',
    description: 'Empty project — configure everything yourself',
    longDescription:
      'A completely empty project. You configure the soul, system prompt, channels, and everything else from scratch. Great if you know exactly what you want.',
    accentColor: '#6b7280',
    defaultName: 'My Project',
    category: 'utility',
    platforms: ['any'],
    features: ['Full control', 'No presets', 'Start fresh'],
    systemPrompt: '',
    nextSteps: [
      {
        id: 'connect-soul',
        label: 'Connect a Soul',
        description: 'Link an AI soul to power your project',
        hrefTemplate: '',
        required: true,
        doneWhen: 'soul',
      },
      {
        id: 'write-prompt',
        label: 'Write a system prompt',
        description: 'Define what your AI should do',
        hrefTemplate: '/projects/{projectId}/settings',
        required: false,
        doneWhen: 'never',
      },
    ],
    isSystem: true,
  },
]

export function getSystemTemplate(id: string): ProjectTemplate | undefined {
  return SYSTEM_TEMPLATES.find(t => t.id === id)
}
