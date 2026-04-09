import { PricingTable } from '@clerk/clerk-react';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('subscription_page_viewed');
  }, [posthog]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Subscriptions</h1>
        </div>
      </header>
      <Separator />
      <div className="p-5">
        <PricingTable for="organization" />
      </div>
    </>
  );
}
