import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    // ✅ ADD THESE CONFIGURATIONS TO FIX SVG LOADING:
    publicDir: resolve('public'), // Explicitly set public directory
    server: {
      fs: {
        strict: false // Allow serving files outside of root
      }
    },
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[ext]' // Keep asset names predictable
        }
      }
    }
  }
})
