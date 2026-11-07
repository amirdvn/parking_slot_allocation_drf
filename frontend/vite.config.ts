import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cjsInterop } from "vite-plugin-cjs-interop"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cjsInterop({
      dependencies: ["react-multi-date-picker"],
    }),
  ],
})