import next from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

// ESLint 9 flat config. `next lint` was removed in Next.js 16, so the
// `lint` script drives the ESLint CLI directly and this file is the single
// entry point for it.
//
// eslint-config-next 16 exports native flat-config arrays, so no FlatCompat
// bridge is needed. Keep the version of this package in step with `next`
// itself: it carries the rules for the App Router APIs that version ships.
export default [
  {
    // Build output and dependencies. Flat config has no implicit ignores
    // beyond node_modules, so everything generated is listed here.
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },

  ...next,
  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // Unused values are a real signal, but an underscore prefix is the
      // conventional way to mark an intentionally ignored binding.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Tests exercise partial fixtures and mock modules, where pinning exact
    // types adds noise without catching real defects.
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
