/**
 * Inktide — AI companion platform for streaming
 */

export const VIDEO_CONFIG = {
  videoId: '',
  autoplay: false,
  controls: true,
  modestbranding: true,
  rel: 0,
} as const

export const NAVIGATION_ITEMS = [
  { label: 'Product', href: '#features', withCaret: true },
  { label: 'Solutions', href: '#how', withCaret: true },
  { label: 'How it works', href: '#how-it-works', withCaret: true },
] as const

export const CONTENT = {
  hero: {
    title: 'Create your AI companion for streaming',
    subtitle:
      'Customize prompts, algorithms and models — make your stream vibrant and interactive',
    ctaPrimary: 'Sign up for free',
    downloadLabel: 'Download OBS plugin for',
    docs: 'Documentation',
    signUpFree: 'Sign up for free',
    logIn: 'Log in',
  },
  features: {
    heading: 'Everything for a unique AI',
    subheading: 'Build the persona that fits you',
    supportButton: 'Support the Project 🙏',
    tryButton: 'Try it out...',
    items: [
      {
        title: 'Prompts and logic',
        description:
          'Change conversation scenarios, add your own speech style and reactions. The AI behaves exactly how your channel needs.',
        icon: '⚡',
      },
      {
        title: 'Appearance and voice',
        description:
          'Customize looks, voice and behavior. Create a recognizable character for your viewers.',
        icon: '✨',
      },
      {
        title: 'API and integrations',
        description:
          'Connect Inktide to Twitch, YouTube, Discord and other platforms. Set up once — works everywhere.',
        icon: '🔌',
      },
    ],
  },
  benefits: {
    heading: 'Why Inktide',
    subheading: 'Analytics and insights to grow your AI companion',
    tabs: [
      {
        id: 'engagement',
        label: 'AI Viewer Engagement Stats',
        description:
          'Tracking viewer engagement with your AI is crucial for streamers and brands. By analyzing conversation metrics, you gain insights into audience behavior and preferences. These analytics help optimize your AI personality, improve interactions, and build stronger connections with your community.',
      },
      {
        id: 'performance',
        label: 'AI Performance Analytics',
        description:
          'Monitor how your AI companion performs across different streaming platforms. Understand response times, conversation quality, and viewer retention. Use these insights to refine prompts and behavior for maximum impact.',
      },
      {
        id: 'integration',
        label: 'Stream Integration Metrics',
        description:
          'See how Inktide integrates with Twitch, YouTube, and Discord. Track donation reactions, chat triggers, and community engagement. Data-driven decisions help you create the perfect AI companion for your channel.',
      },
      {
        id: 'growth',
        label: 'Channel Growth & Trends',
        description:
          'Identify trends and growth opportunities for your AI-powered stream. Compare performance across time periods and discover what resonates with your audience.',
      },
    ],
  },
  cta: {
    heading: 'Join early',
    description:
      'Discounts and bonuses for early users and streamers. Start building your AI today.',
    button: 'Get early access',
    badge: 'Early adopter discount',
  },
  demo: {
    heading: 'See how it works',
    description:
      'Inktide sets up in minutes and integrates into your stream with no hassle.',
    steps: [
      {
        heading: 'See how it works',
        description:
          'Inktide sets up in minutes and integrates into your stream with no hassle. Connect the OBS plugin, add your AI, and go live.',
        videoId: '',
        image: 'https://www.sandfield.co.nz/media/ocwmcnyw/bernd-dittrich-d_3ekbsg1tg-unsplash-1.webp?width=1920&height=1080&v=1d9745ecae6a000',
      },
      {
        heading: 'Ready out of the box',
        description:
          'No complex setup — just install, configure your AI personality, and start streaming. Everything works from the first click.',
        videoId: '',
        image: 'https://images.wallpapershq.com/wallpapers/405/wallpaper_405_1920x1080.jpg',
      },
      {
        heading: 'Complex tasks become easy',
        description:
          'The AI knows your channel and uses this knowledge to offer smart suggestions, natural reactions, and relevant responses in every context. Donations, chat, raids — handled automatically.',
        videoId: '',
        image: 'https://www.sandfield.co.nz/media/ocwmcnyw/bernd-dittrich-d_3ekbsg1tg-unsplash-1.webp?width=1920&height=1080&v=1d9745ecae6a000',
      },
      {
        heading: 'Built-in tools',
        description:
          'Customize prompts, voice, and appearance without leaving the dashboard. Run, tune, and test your AI companion — all important tools are within a hand\'s reach.',
        videoId: '',
        image: 'https://images.wallpapershq.com/wallpapers/405/wallpaper_405_1920x1080.jpg',
      },
      {
        heading: 'Grow with your community',
        description:
          'Analytics and insights help you understand what resonates. Track engagement, optimize reactions, and build an AI that truly reflects your stream\'s personality.',
        videoId: '',
        image: 'https://www.sandfield.co.nz/media/ocwmcnyw/bernd-dittrich-d_3ekbsg1tg-unsplash-1.webp?width=1920&height=1080&v=1d9745ecae6a000',
      },
    ],
  },
  partners: {
    heading: 'Support for multiple LLM models',
  },
  learn: {
    heading: 'Insights & Research',
    subheading: 'Data-driven findings on AI-powered streaming',
    sectionHeading: "What You'll Learn",
    bullets: [
      'The latest data on AI engagement trends across Twitch, YouTube Live and TikTok Live.',
      'How AI companions enhance viewer interaction and boost stream retention.',
      'The real business benefits for brands, agencies, and content creators.',
      'Proven methods for measuring and optimizing AI performance.',
      'Expert recommendations and streaming perspective provided for this report.',
    ],
    cta: 'help with development',
  },
} as const
