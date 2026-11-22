import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { AuthUser } from './types/auth';
import { routerBasePath } from './lib/basePath';

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
    user: AuthUser | null;
  };
}

export const router = createRouter({
  routeTree,
  basepath: routerBasePath(import.meta.env.BASE_URL),
  trailingSlash: 'preserve',
  context: {
    auth: { isAuthenticated: false, user: null },
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
