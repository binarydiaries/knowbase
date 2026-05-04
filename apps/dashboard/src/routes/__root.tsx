import { SidebarInset, SidebarProvider } from '@knowbase/ui/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppSidebar } from '@/components/AppSidebar/AppSidebar.tsx';

export const Route = createRootRoute({
  component: RootComponent,
});

export default function RootComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
