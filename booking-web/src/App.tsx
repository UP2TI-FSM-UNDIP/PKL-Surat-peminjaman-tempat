import { RouterProvider } from '@tanstack/react-router';
import { router } from './main';
import { AuthBootstrap } from '@/components/Auth/AuthBootstrap';

export default function App() {
  return (
    <AuthBootstrap router={router}>
      <RouterProvider router={router} />
    </AuthBootstrap>
  );
}
