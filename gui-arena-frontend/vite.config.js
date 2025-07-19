import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: '.', // Explicitly set the root directory
  plugins: [react()],
  define: {
    global: 'globalThis',
    process: 'process',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      vm: 'vm-browserify',
      zlib: 'browserify-zlib',
      url: 'url',
      querystring: 'querystring-es3',
      assert: 'assert',
      constants: 'constants-browserify',
      domain: 'domain-browser',
      events: 'events',
      punycode: 'punycode',
      string_decoder: 'string_decoder',
      timers: 'timers-browserify',
      tty: 'tty-browserify',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'crypto-browserify',
      'stream-browserify',
      'util',
      '@ant-design/icons',
      'antd',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html') // Explicitly define the entry point
      },
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          aptos: ['@aptos-labs/ts-sdk', '@aptos-labs/wallet-adapter-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
})