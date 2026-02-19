import { PricingTable } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-5">
      <PricingTable for="organization" />
    </div>
  );
}
