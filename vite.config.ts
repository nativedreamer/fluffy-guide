import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'node:url';
import {defineConfig, type Plugin} from 'vite';

function apiPlugin(): Plugin {
  return {
    name: 'match-analysis-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/fixtures') && !url.startsWith('/api/analysis')) return next();
        try {
          const parsed = new URL(url, 'http://127.0.0.1');
          const query = Object.fromEntries(parsed.searchParams);
          const wrapped = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return wrapped;
            },
            json(body: unknown) {
              res.setHeader('content-type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(body));
            }
          });
          const request = Object.assign(req, { query });
          const load = (file: string) => import(pathToFileURL(path.resolve(file)).href);
          if (parsed.pathname === '/api/fixtures') {
            const { default: handler } = await load('api/fixtures.js');
            await handler(request, wrapped);
            return;
          }
          const { default: handler } = await load('api/analysis.js');
          await handler(request, wrapped);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis API failed' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 3000,
      strictPort: Boolean(process.env.PORT),
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
