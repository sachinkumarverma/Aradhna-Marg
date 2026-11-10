import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-manifest-dev-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && (req.url === '/manifest.webmanifest' || req.url.startsWith('/manifest.webmanifest?'))) {
            const referer = (req.headers['referer'] as string) || '';
            const host = (req.headers['host'] as string) || '';
            if (host.includes('admin') || referer.includes('/admin') || referer.includes('app=admin')) {
              req.url = '/manifest-admin.webmanifest';
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@api': path.resolve(__dirname, './src/api'),
      '@features': path.resolve(__dirname, './src/admin/features'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@common': path.resolve(__dirname, './src/common'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@user': path.resolve(__dirname, './src/user'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@i18n': path.resolve(__dirname, './src/i18n')
    }
  },
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
