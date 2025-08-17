import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./__tests__/setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx']
    }
});
