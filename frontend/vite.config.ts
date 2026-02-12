import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA Plugin for service worker and offline support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GeneReason - Medical Genetics Training',
        short_name: 'GeneReason',
        description: 'AI-powered training application for medical genetics residents',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache API responses
            urlPattern: /^https?:\/\/.*\/api\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache static assets
            urlPattern: /^https?:\/\/.*\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        // Skip waiting for service worker activation
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false // Disable in development
      }
    }),
    // Bundle visualizer for analysis
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  build: {
    // Enable minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false
      }
    },
    // Split chunks for better caching
    rollupOptions: {
      output: {
        // Consistent file naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id: string) => {
          // Vendor chunks
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          if (id.includes('node_modules/@headlessui')) {
            return 'headlessui';
          }
          // Reaflow and its dependencies are large, split them
          if (id.includes('node_modules/reaflow') ||
            id.includes('node_modules/reablocks') ||
            id.includes('node_modules/reaviz') ||
            id.includes('node_modules/elkjs') ||
            id.includes('node_modules/@react-spring')) {
            return 'graph-vendor';
          }
          // Markdown rendering
          if (id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/remark') ||
            id.includes('node_modules/rehype') ||
            id.includes('node_modules/unified') ||
            id.includes('node_modules/micromark')) {
            return 'markdown';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          // Other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          // Feature chunks - reasoning components
          if (id.includes('src/components/reasoning/')) {
            return 'reasoning';
          }
          // Feature chunks - question components
          if (id.includes('src/components/question/')) {
            return 'question';
          }
          // Feature chunks - graph components
          if (id.includes('src/components/graph/')) {
            return 'graph';
          }
          return undefined;
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Use modern ES modules
    target: 'esnext',
    // Enable source maps for production debugging
    sourcemap: false,
    // Asset file naming
    assetsDir: 'assets'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'clsx'
    ],
    // Pre-bundle these dependencies
    exclude: []
  },
  // Enable gzip compression preview
  server: {
    // Enable compression in dev
    cors: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true
  }
})
