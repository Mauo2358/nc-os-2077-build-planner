import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from the web root by default. If you ever host it under a sub-path
  // (e.g. https://example.com/planner/), set base: '/planner/'.
  base: '/',
})
