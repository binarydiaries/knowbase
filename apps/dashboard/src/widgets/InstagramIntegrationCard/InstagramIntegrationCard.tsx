import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import { Separator } from '@knowbase/ui/components/separator';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { client } from '@/services/client.gen';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  pageId?: string;
  instagramAccountId?: string;
  username?: string | null;
  name?: string | null;
  boundToChatbotId?: string | null;
  chatbotName?: string | null;
}

export function InstagramIntegrationCard() {
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');

  const { connected, username, boundToChatbotId, chatbotName, setConnection, clearConnection } =
    useInstagramConnection();

  const { isLoading } = useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/instagram/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.pageId && data.instagramAccountId) {
        setConnection({
          pageId: data.pageId,
          instagramAccountId: data.instagramAccountId,
          username: data.username ?? null,
          boundToChatbotId: data.boundToChatbotId ?? null,
          chatbotName: data.chatbotName ?? null,
        });
      }
      return data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await client.post({
        url: '/instagram/connect',
        body: { pageAccessToken, pageId, instagramAccountId },
        responseType: 'json',
      });
      return res.data as {
        pageId: string;
        instagramAccountId: string;
        username: string | null;
        name: string | null;
      };
    },
    onSuccess: (data) => {
      setConnection({
        pageId: data.pageId,
        instagramAccountId: data.instagramAccountId,
        username: data.username,
        boundToChatbotId: null,
        chatbotName: null,
      });
      setPageAccessToken('');
      setPageId('');
      setInstagramAccountId('');
      toast.success('Instagram account connected');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await client.delete({
        url: '/instagram/connection',
        responseType: 'json',
      });
    },
    onSuccess: () => {
      clearConnection();
      toast.success('Instagram disconnected');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Instagram gradient logo */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
            <svg
              viewBox="0 0 24 24"
              className="size-6 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">Instagram</CardTitle>
            <CardDescription className="text-sm">
              {connected
                ? 'Your Instagram account is connected.'
                : 'Connect your Instagram Professional account to enable DM responses.'}
            </CardDescription>
          </div>
        </div>
        {connected && (
          <Badge
            variant="outline"
            className="shrink-0 text-green-600 border-green-300 bg-green-50"
          >
            <span className="size-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
            Connected
          </Badge>
        )}
      </CardHeader>

      {!connected && !isLoading && (
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ig-account-id">Instagram Account ID</Label>
              <Input
                id="ig-account-id"
                placeholder="1234567890"
                value={instagramAccountId}
                onChange={(e) => setInstagramAccountId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ig-page-id">Facebook Page ID</Label>
              <Input
                id="ig-page-id"
                placeholder="1234567890"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ig-token">Page Access Token</Label>
              <Input
                id="ig-token"
                type="password"
                placeholder="EAAxxxxxxxx…"
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <a
              href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              How to get these
            </a>
            <Button
              size="sm"
              disabled={
                !pageAccessToken ||
                !pageId ||
                !instagramAccountId ||
                connectMutation.isPending
              }
              onClick={() => connectMutation.mutate()}
            >
              {connectMutation.isPending ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      )}

      {connected && (
        <CardContent className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account
            </p>
            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="font-medium">
                {username ? `@${username}` : 'Connected'}
              </span>
              {boundToChatbotId ? (
                <Badge variant="secondary">{chatbotName ?? 'Bound'}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Not assigned to any chatbot
                </span>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={disconnectMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    'This will disable all Instagram channels across your chatbots. Continue?',
                  )
                ) {
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
  );
}
