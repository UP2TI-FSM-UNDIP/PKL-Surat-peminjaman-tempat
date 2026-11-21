import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProfileCompletionModal } from '@/components/Auth/ProfileCompletionModal';
import { NotFoundPage, ErrorPage } from '@/components/common/ErrorPages';

const queryClient = new QueryClient();

const RootLayout = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ProfileCompletionModal />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});
