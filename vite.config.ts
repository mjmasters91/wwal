import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: https://mjmasters91.github.io/wwal/
// GitHub Pages serves dist/404.html for unknown paths, which keeps BrowserRouter working.
export default defineConfig({
  base: '/wwal/',
  plugins: [
    react(),
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      closeBundle() {
        const index = resolve('dist/index.html')
        if (existsSync(index)) copyFileSync(index, resolve('dist/404.html'))
      },
    },
  ],
  server: { host: '0.0.0.0', port: 41721 },
  preview: { host: '0.0.0.0', port: 41721 },
})
