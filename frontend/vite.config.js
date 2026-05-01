import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.VITE_DEV_API_TARGET?.trim()

  return {
    plugins: [react()],
    server:
      mode === 'development' && devProxyTarget
        ? {
            proxy: {
              '/api': { target: devProxyTarget, changeOrigin: true },
            },
          }
        : {},
  }
})
