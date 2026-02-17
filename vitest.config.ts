import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      clean: false,
      all: true,
      include: ['src/**/*.{ts,tsx}', 'functions/**/*.ts'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.d.ts', 'src/types/*.ts', 'functions/types.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 100,
        functions: 100,
        perFile: true,
      },
    },
  },
})
