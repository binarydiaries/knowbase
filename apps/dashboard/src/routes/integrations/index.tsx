import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { toast } from '@knowbase/ui/components/sonner';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { client } from '@/services/client.gen';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { InstagramIntegrationCard } from '@/widgets/InstagramIntegrationCard/InstagramIntegrationCard.tsx';
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

// ── Instagram OAuth callback handler ─────────────────────────────────────────

interface PendingAccount {
  instagramAccountId: string;
  username: string;
  pageName: string;
}

type OAuthExchangeResult =
  | { connected: true; instagramAccountId: string; username: string }
  | { connected: false; pendingKey: string; accounts: PendingAccount[] };

function useInstagramOAuthCallback() {
  const navigate = useNavigate();
  const { setConnection } = useInstagramConnection();
  const handledRef = useRef(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error(`Facebook login cancelled: ${params.get('error_description') ?? error}`);
      navigate({ to: '/integrations', search: {} });
      return;
    }

    if (!code || state !== 'instagram_oauth' || handledRef.current) return;
    handledRef.current = true;

    const redirectUri = `${window.location.origin}/integrations`;

    setExchanging(true);
    client
      .post({ url: '/instagram/oauth/exchange', body: { code, redirectUri }, responseType: 'json' })
      .then((res) => {
        const data = res.data as OAuthExchangeResult;
        if (data.connected) {
          setConnection({
            instagramAccountId: data.instagramAccountId,
            username: data.username,
            boundToAgentId: null,
            agentName: null,
          });
          toast.success(`Connected as @${data.username}`);
        } else {
          // Multiple accounts — show picker
          setPendingKey(data.pendingKey);
          setPendingAccounts(data.accounts);
        }
      })
      .catch((err) => {
        toast.error(`Failed to connect Instagram: ${getErrorMessage(err)}`);
      })
      .finally(() => {
        setExchanging(false);
        // Strip OAuth params from URL without triggering a navigation
        window.history.replaceState({}, '', '/integrations');
      });
  }, [navigate, setConnection]);

  const confirmAccount = async (instagramAccountId: string) => {
    try {
      const res = await client.post({
        url: '/instagram/oauth/confirm',
        body: { pendingKey: pendingKey!, instagramAccountId },
        responseType: 'json',
      });
      const data = res.data as { instagramAccountId: string; username: string };
      setConnection({
        instagramAccountId: data.instagramAccountId,
        username: data.username,
        boundToAgentId: null,
        agentName: null,
      });
      toast.success(`Connected as @${data.username}`);
      setPendingKey(null);
      setPendingAccounts([]);
    } catch (err) {
      toast.error(`Failed to confirm account: ${getErrorMessage(err)}`);
    }
  };

  return { exchanging, pendingKey, pendingAccounts, confirmAccount };
}

function RouteComponent() {
  const { exchanging, pendingKey, pendingAccounts, confirmAccount } =
    useInstagramOAuthCallback();

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
        {/* OAuth exchange banner */}
        {exchanging && (
          <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            Connecting your Instagram account…
          </div>
        )}

        {/* Multi-account picker */}
        {pendingKey && pendingAccounts.length > 0 && (
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <p className="text-sm font-medium">Choose an Instagram account to connect:</p>
            <div className="space-y-2">
              {pendingAccounts.map((account) => (
                <button
                  key={account.instagramAccountId}
                  type="button"
                  onClick={() => confirmAccount(account.instagramAccountId)}
                  className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                    <span className="text-[10px] font-bold text-white">IG</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">@{account.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{account.pageName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
          {import.meta.env.VITE_INSTAGRAM_ENABLED === 'true' ? (
            <InstagramIntegrationCard />
          ) : (
            <ComingSoonCard
              name="Instagram"
              description="Handle Instagram Direct Message conversations."
            />
          )}
          <ComingSoonCard
            name="Discord"
            description="Integrate your agent into Discord servers."
          />
        </div>
      </div>
    </>
  );
}
