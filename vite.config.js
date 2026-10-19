import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isCloud = mode === 'cloud'
  const cloudPlugins = isCloud ? [(await import('@cloudflare/vite-plugin')).cloudflare()] : []
  return {
    base: isCloud ? '/' : './',
    plugins: [vue(), ...cloudPlugins],
    build: {
      outDir: isCloud ? 'dist-cloud' : 'dist',
    },
    css: {
      // 原 postcss.config.js 的内容，与构建配置放在一起
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    server: {
      watch: {
        ignored: ['**/.wrangler/**', '**/dist-cloud/**', '**/tmp/**'],
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
