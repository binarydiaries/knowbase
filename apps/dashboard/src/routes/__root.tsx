import { SidebarInset, SidebarProvider } from '@knowbase/ui/components/sidebar';
import * as Sentry from '@sentry/react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar/AppSidebar.tsx';

export const Route = createRootRoute({
  component: RootComponent,
});

function SentryIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user, isLoaded]);

  return null;
}

export default function RootComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SentryIdentify />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
