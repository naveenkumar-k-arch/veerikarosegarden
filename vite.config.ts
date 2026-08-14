import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Local Dev Server Proxy — Only used during 'npm run dev' on your local computer.
      // In production / Vercel, this server block is ignored and Vercel handles /api via api/index.ts.
      proxy: {
        '/api': {
          target: process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn('[Vite Proxy] API proxy error:', err.message);
            });
          },
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('firebase')) return 'vendor-firebase';
              return 'vendor-core';
            }
          }
        }
      }
    }
  };
});
