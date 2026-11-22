import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/peminjaman-ruang/';

  if (!base.startsWith('/') || !base.endsWith('/')) {
    throw new Error('VITE_BASE_PATH harus diawali dan diakhiri dengan "/"');
  }

  return {
    base,
    plugins: [tanstackRouter(), react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 20081,
      host: true,
      allowedHosts: ['apps-fsm.undip.ac.id', 'localhost', '10.137.58.124', '10.137.58.142'],
    },
    optimizeDeps: {
      esbuildOptions: {
        supported: {
          'top-level-await': true,
        },
      },
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@backend': path.resolve(__dirname, '../e-office-api-v2/src'),
      },
    },
  };
});
