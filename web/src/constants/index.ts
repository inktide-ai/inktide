/**
 * Chimera — платформа ИИ-напарников для стриминга
 */

export const VIDEO_CONFIG = {
  videoId: 'dQw4w9WgXcQ',
  autoplay: false,
  controls: true,
  modestbranding: true,
  rel: 0,
} as const

export const STAR_CONFIG_SECTION = {
  count: 50,
  minSize: 0.5,
  maxSize: 2.5,
  minOpacity: 0.2,
  maxOpacity: 0.7,
} as const

export const NAVIGATION_ITEMS = [
  { label: 'Продукт', href: '#features', withCaret: true },
  { label: 'Решения', href: '#how', withCaret: true },
  { label: 'Как работает', href: '#how-it-works', withCaret: true },
] as const

export const CONTENT = {
  hero: {
    title: 'Создай своего ИИ‑напарника для стрима',
    subtitle:
      'Настраивай промпты, алгоритмы и модели — сделай стрим ярким и интерактивным',
    ctaPrimary: 'Зарегистрируйтесь бесплатно',
    downloadLabel: 'Загрузить OBS плагин для',
    docs: 'Документация',
    signUpFree: 'Зарегистрируйтесь бесплатно',
    logIn: 'Войти',
  },
  features: {
    heading: 'Всё для уникального ИИ',
    subheading: 'Собери образ под себя',
    items: [
      {
        title: 'Промпты и логика',
        description:
          'Меняй сценарии общения, добавляй свою манеру речи и реакции. ИИ ведёт себя именно так, как нужно твоему каналу.',
        icon: '⚡',
      },
      {
        title: 'Внешний вид и голос',
        description:
          'Кастомизируй внешность, голос и поведение. Создай узнаваемого персонажа для своих зрителей.',
        icon: '✨',
      },
      {
        title: 'API и интеграции',
        description:
          'Подключай Chimera к Twitch, YouTube, Discord и другим платформам. Один раз настроил — работает везде.',
        icon: '🔌',
      },
    ],
  },
  benefits: {
    heading: 'Почему Chimera',
    items: [
      { text: 'Гибкость настройки', highlight: 'под любую идею' },
      { text: 'Уникальные ИИ‑партнёры', highlight: 'которых больше ни у кого нет' },
      { text: 'Простой интерфейс', highlight: 'разберётся даже новичок' },
    ],
  },
  cta: {
    heading: 'Присоединяйся первым',
    description:
      'Скидки и бонусы для ранних пользователей и стримеров. Начни создавать своего ИИ уже сегодня.',
    button: 'Получить ранний доступ',
    badge: 'Скидка для первых',
  },
  demo: {
    heading: 'Посмотри, как это работает',
    description:
      'Chimera настраивается за минуты и встраивается в твой стрим без лишних заморочек.',
  },
  partners: {
    heading: 'Поддержка разных LLM моделей',
  },
} as const
