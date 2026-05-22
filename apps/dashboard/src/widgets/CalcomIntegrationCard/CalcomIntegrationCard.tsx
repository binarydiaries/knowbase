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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarClock, LockIcon } from 'lucide-react';
import { useState } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan.ts';
import { client } from '@/services/client.gen';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface CalcomConnectionResponse {
  connected: boolean;
}

export function CalcomIntegrationCard() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { isPaid, isLoading: planLoading } = useClerkPlan();
  const queryClient = useQueryClient();

  const { data: connectionData, isLoading } = useQuery({
    queryKey: ['calcom-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/calcom-connection',
        responseType: 'json',
      });
      return res.data as CalcomConnectionResponse;
    },
  });

  const connected = connectionData?.connected ?? false;

  const connectMutation = useMutation({
    mutationFn: async () => {
      await client.post({
        url: '/calcom-connection',
        body: { calApiKey: apiKey },
        bodySerializer: JSON.stringify,
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json',
      });
    },
    onSuccess: () => {
      toast.success('Cal.com connected successfully.');
      setSheetOpen(false);
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['calcom-connection'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await client.delete({
        url: '/calcom-connection',
        responseType: 'json',
      });
    },
    onSuccess: () => {
      toast.success('Cal.com disconnected.');
      queryClient.invalidateQueries({ queryKey: ['calcom-connection'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const isLocked = !isPaid && !planLoading;

  return (
    <>
      <Card className={`w-full ${isLocked ? 'opacity-60' : ''}`}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
            <CalendarClock className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Cal.com</CardTitle>
              {isLocked && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                  <LockIcon className="size-3" />
                  Starter+
                </span>
              )}
            </div>
            <CardDescription>
              Book appointments directly inside your agent chat.
            </CardDescription>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="h-8 animate-pulse rounded bg-muted" />
          ) : connected ? (
            <>
              <Badge
                variant="outline"
                className="w-fit border-green-500 text-green-600"
              >
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="w-fit text-destructive hover:text-destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </>
          ) : isLocked ? (
            <Link
              to="/settings/billing"
              className="text-sm text-primary hover:underline"
            >
              Upgrade to connect Cal.com →
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setSheetOpen(true)}
            >
              Connect Cal.com
            </Button>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col gap-0 sm:max-w-md">
          <SheetHeader className="px-6 py-4">
            <SheetTitle>Connect Cal.com</SheetTitle>
            <SheetDescription>
              Enter your Cal.com API key to enable appointment scheduling in
              your agents.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-6 pb-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calApiKey">Cal.com API Key</Label>
              <Input
                id="calApiKey"
                type="password"
                placeholder="cal_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Find your API key in{' '}
                <a
                  href="https://app.cal.com/settings/developer/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Cal.com → Settings → Developer → API Keys
                </a>
              </p>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t mt-auto">
            <Button
              variant="outline"
              onClick={() => {
                setSheetOpen(false);
                setApiKey('');
              }}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={!apiKey.trim() || connectMutation.isPending}
            >
              {connectMutation.isPending ? 'Connecting…' : 'Connect'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
