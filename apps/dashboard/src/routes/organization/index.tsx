import { OrganizationProfile } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-5">
      <OrganizationProfile />
    </div>
  );
}
