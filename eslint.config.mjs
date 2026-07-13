// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            '@next/next': nextPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        // Service worker: plain JS running in the worker global scope, not the app bundle.
        files: ['public/sw.js'],
        languageOptions: {
            globals: { self: 'readonly' },
        },
    },
    {
        ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'postcss.config.js'],
    },
)
