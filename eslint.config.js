import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                console: 'readonly',
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                indexedDB: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                FormData: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                Headers: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                HTMLElement: 'readonly',
                HTMLDivElement: 'readonly',
                HTMLInputElement: 'readonly',
                Element: 'readonly',
                Node: 'readonly',
                Event: 'readonly',
                KeyboardEvent: 'readonly',
                MouseEvent: 'readonly',
                CustomEvent: 'readonly',
                crypto: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react': react,
            'react-hooks': reactHooks
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    }
]
