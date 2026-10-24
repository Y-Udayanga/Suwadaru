import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { chat } from "./server/chat.ts"

// https://vite.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [react(), tailwindcss(), {name:'suwadaru-chat', configureServer(server) { const env=loadEnv(mode,process.cwd(),''); server.middlewares.use('/api/chat',(req,res)=>{void chat(req,res,env)}) }, configurePreviewServer(server) { const env=loadEnv(mode,process.cwd(),''); server.middlewares.use('/api/chat',(req,res)=>{void chat(req,res,env)}) }}],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}))
