import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // I test BFF girano in ambiente Node.js perché importano route handler
    // che usano next/server, Buffer e API Node.js non disponibili in jsdom.
    environmentMatchGlobs: [
      ['__tests__/lib/bff-security.test.ts', 'node'],
    ],
    env: {
      NEXT_PUBLIC_AUTH_API_URL: 'http://localhost:8000',
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.{ts,js}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
