import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub repository name (ต้องตรงกับชื่อ repo บน GitHub)
const REPO_NAME = 'spleave'

export default defineConfig({
  plugins: [react()],
  // Set base to repo name for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
})
