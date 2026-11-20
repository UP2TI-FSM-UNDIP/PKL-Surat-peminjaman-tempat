import { RouterProvider } from '@tanstack/react-router';
import { type UserRole, router } from './main';
import { DevLoginBootstrap } from '@/components/dev/DevLoginBootstrap';

export default function App() {
  const authState = {
    isAuthenticated: true,
    user: {
      id: 1,
      name: 'Admin Ganteng',
      role: 'admin' as UserRole,
    },
  };

  return (
    <DevLoginBootstrap>
      <RouterProvider router={router} context={{ auth: authState }} />
    </DevLoginBootstrap>
  );
}
