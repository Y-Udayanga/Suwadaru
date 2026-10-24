import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { chatHandler } from './server/chat.ts'
export default defineConfig(({mode}) => ({
  plugins: [react(), tailwindcss(), {name: 'local-ai-api', configureServer(server) {
    const env = {...process.env, ...loadEnv(mode, process.cwd(), '')}
    server.middlewares.use('/api/chat', (req, res) => { void chatHandler(req, res, env) })
  }}],
  resolve: {alias: {'@': path.resolve(import.meta.dirname, './src')}},
}))
