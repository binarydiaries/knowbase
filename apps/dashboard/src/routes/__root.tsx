import { SidebarInset, SidebarProvider } from '@knowbase/ui/components/sidebar';
import * as amplitude from '@amplitude/unified';
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
      amplitude.setUserId(user.id);
      const identify = new amplitude.Identify();
      identify.set('email', user.primaryEmailAddress?.emailAddress ?? '');
      identify.set('name', user.fullName ?? '');
      amplitude.identify(identify);
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
