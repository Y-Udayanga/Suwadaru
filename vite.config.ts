import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { chatHandler } from './server/chat.ts'
export default defineConfig(({mode}) => {
  const env = {...process.env, ...loadEnv(mode, process.cwd(), '')}
  const ai: Plugin = {
    name: 'ai-api',
    configureServer(server) { server.middlewares.use('/api/chat', (req,res) => { void chatHandler(req,res,env) }) },
    configurePreviewServer(server) { server.middlewares.use('/api/chat', (req,res) => { void chatHandler(req,res,env) }) },
  }
  return { plugins: [react(), tailwindcss(), ai], resolve: {alias: {'@': path.resolve(import.meta.dirname, './src')}} }
})
