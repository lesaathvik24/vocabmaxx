import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/integration/**/*.test.ts'],
        setupFiles: ['./tests/integration/setup.ts'],
        testTimeout: 30_000,
        hookTimeout: 30_000,
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            'server-only': path.resolve(__dirname, 'tests/_shims/server-only.ts'),
        },
    },
})
