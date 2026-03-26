import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'

export default defineConfig({
  root: 'src',
  base: "./",
  publicDir: '../public',
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      'd3-thematika': path.resolve(__dirname, 'third_party/d3-thematika/thematika.esm.js')
    }
  },
  server: {
    open: true
  },
  build: {
    outDir: '../dist'
  }
})