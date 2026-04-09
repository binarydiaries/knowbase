import { useUser } from '@clerk/clerk-react';
import { SidebarInset, SidebarProvider } from '@knowbase/ui/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { usePostHog, PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar/AppSidebar.tsx';

export const Route = createRootRoute({
  component: RootComponent,
});

function PostHogIdentify() {
  const posthog = usePostHog();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    }
  }, [posthog, user, isLoaded]);

  return null;
}

export default function RootComponent() {
  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
      options={{
        api_host: '/ingest',
        ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
        defaults: '2026-01-30',
        capture_exceptions: true,
        debug: import.meta.env.DEV,
      }}
    >
      <PostHogIdentify />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </PostHogProvider>
  );
}
