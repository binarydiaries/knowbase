import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { SlackIntegrationCard } from '@/widgets/SlackIntegrationCard/SlackIntegrationCard.tsx';
import { WhatsAppIntegrationCard } from '@/widgets/WhatsAppIntegrationCard/WhatsAppIntegrationCard.tsx';

export const Route = createFileRoute('/integrations/')({
  component: RouteComponent,
});

function ComingSoonCard({
  name,
  description,
  logoSrc,
}: {
  name: string;
  description: string;
  logoSrc?: string;
}) {
  return (
    <Card className="w-full opacity-60">
      <CardHeader className="flex flex-row items-center gap-3">
        {logoSrc ? (
          <img src={logoSrc} alt={name} className="size-10 rounded-lg" />
        ) : (
          <div className="size-10 rounded-lg bg-muted" />
        )}
        <div>
          <CardTitle className="text-base">{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          Coming Soon
        </span>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium">Integrations</h1>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Connect external platforms to your agents. Each integration is
            configured once per organization.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {import.meta.env.VITE_WHATSAPP_ENABLED === 'true' ? (
            <WhatsAppIntegrationCard />
          ) : (
            <ComingSoonCard
              name="WhatsApp"
              description="Send and receive messages via WhatsApp Business."
            />
          )}
          {import.meta.env.VITE_SLACK_ENABLED === 'true' ? (
            <SlackIntegrationCard />
          ) : (
            <ComingSoonCard
              name="Slack"
              description="Send and receive messages in Slack channels."
            />
          )}
          <ComingSoonCard
            name="Discord"
            description="Integrate your agent into Discord servers."
          />
          <ComingSoonCard
            name="Instagram"
            description="Handle Instagram Direct Message conversations."
          />
        </div>
      </div>
    </>
  );
}
