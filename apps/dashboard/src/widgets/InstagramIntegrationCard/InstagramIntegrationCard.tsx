import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { Sheet } from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LockIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useClerkPlan } from '@/hooks/useClerkPlan.ts';
import { client } from '@/services/client.gen';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { InstagramSetupPanel } from './InstagramSetupPanel.tsx';

interface ConnectionResponse {
  connected: boolean;
  instagramAccountId?: string;
  username?: string | null;
  boundToAgentId?: string | null;
  agentName?: string | null;
}

export function InstagramIntegrationCard() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { connected, username, boundToAgentId, agentName, setConnection, clearConnection } =
    useInstagramConnection();
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const res = await client.get({ url: '/instagram/connection', responseType: 'json' });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.instagramAccountId) {
        setConnection({
          instagramAccountId: data.instagramAccountId,
          username: data.username ?? null,
          boundToAgentId: data.boundToAgentId ?? null,
          agentName: data.agentName ?? null,
        });
      }
      return data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await client.delete({ url: '/instagram/connection', responseType: 'json' });
    },
    onSuccess: () => {
      clearConnection();
      toast.success('Instagram disconnected');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await client.get({ url: '/instagram/test-connection', responseType: 'json' });
      return res.data as { ok: boolean; username: string };
    },
    onSuccess: (data) => {
      toast.success(`Connection is healthy — @${data.username}`);
    },
    onError: (error) => toast.error(`Connection failed: ${getErrorMessage(error)}`),
  });

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
              <InstagramLogo />
            </div>
            <div>
              <CardTitle className="text-base">Instagram</CardTitle>
              <CardDescription className="text-sm">
                {connected && username
                  ? `Connected as @${username}`
                  : 'Connect your Instagram Business Account.'}
              </CardDescription>
            </div>
          </div>
          {isPaid && connected && (
            <Badge variant="outline" className="shrink-0 text-green-600 border-green-300 bg-green-50">
              <span className="size-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
              Connected
            </Badge>
          )}
        </CardHeader>

        {/* Free plan gate */}
        {!planLoading && !isPaid && (
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="rounded-full border p-3">
              <LockIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Instagram integration is available on paid plans. Upgrade to connect your account.
            </p>
            <Button size="sm" asChild>
              <Link to="/subscriptions">Upgrade Plan</Link>
            </Button>
          </CardContent>
        )}

        {/* Not connected */}
        {isPaid && !connected && (
          <CardContent className="pt-0">
            <Button size="sm" onClick={() => setPanelOpen(true)}>
              Set up
            </Button>
          </CardContent>
        )}

        {/* Connected */}
        {isPaid && connected && (
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Agent Binding
              </p>
              {boundToAgentId ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">@{username}</span>
                  <Badge variant="secondary">{agentName ?? 'Bound'}</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not assigned to any agent. Go to an agent's Channels tab to assign.
                </p>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={testMutation.isPending}
                onClick={() => testMutation.mutate()}
              >
                {testMutation.isPending ? 'Testing…' : 'Test Connection'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={disconnectMutation.isPending}
                onClick={() => {
                  if (window.confirm('This will disable the Instagram channel across your agents. Continue?')) {
                    disconnectMutation.mutate();
                  }
                }}
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        {panelOpen && <InstagramSetupPanel onClose={() => setPanelOpen(false)} />}
      </Sheet>
    </>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
