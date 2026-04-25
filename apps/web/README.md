# Inktide — Web Application

Веб-приложение платформы ИИ-напарников для стриминга. React, TypeScript, Vite.

## 🚀 Технологии

- **React 18** — UI библиотека
- **TypeScript** — типизация
- **Vite** — сборщик и dev-сервер
- **CSS Modules** — модульные стили

## 📁 Структура проекта

```
web/
├── src/
│   ├── components/          # React компоненты
│   │   ├── BenefitsSection/
│   │   ├── CTASection/
│   │   ├── FeaturesSection/
│   │   ├── GlitchText/
│   │   ├── HeroInktide/     # Hero-секция
│   │   ├── LandingPage/
│   │   ├── LoginModal/
│   │   ├── Navigation/
│   │   ├── PartnerLogos/
│   │   ├── RegisterModal/
│   │   ├── VideoSection/
│   │   └── index.ts
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── api/
├── package.json
└── ...
```

## 🛠️ Установка и запуск

```bash
npm install
npm run dev
```

Приложение: `http://localhost:5173`

```bash
npm run build    # production сборка
npm run preview  # превью сборки
```
