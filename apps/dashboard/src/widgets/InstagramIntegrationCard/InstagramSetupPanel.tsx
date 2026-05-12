import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { client } from '@/services/client.gen';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const manualSchema = z.object({
  pageAccessToken: z.string().min(1, 'Access Token is required'),
});
type ManualFormValues = z.infer<typeof manualSchema>;

interface PendingAccount {
  instagramAccountId: string;
  username: string;
  pageName: string;
}

type OAuthExchangeResult =
  | { connected: true; instagramAccountId: string; username: string }
  | { connected: false; pendingKey: string; accounts: PendingAccount[] };

export function InstagramSetupPanel({ onClose }: { onClose: () => void }) {
  const { setConnection } = useInstagramConnection();
  const [showManual, setShowManual] = useState(false);
  // Multi-account picker state
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);

  const { control, handleSubmit, reset } = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: { pageAccessToken: '' },
  });

  const { data: setupInfo } = useQuery({
    queryKey: ['instagram-setup-info'],
    queryFn: async () => {
      const res = await client.get({ url: '/instagram/setup-info', responseType: 'json' });
      return res.data as { webhookUrl: string; verifyToken: string };
    },
  });

  // ── Facebook Login ────────────────────────────────────────────────────────

  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
  const redirectUri = `${window.location.origin}/integrations`;

  const handleFacebookLogin = () => {
    if (!facebookAppId) {
      toast.error('Facebook App ID not configured. Use manual setup below.');
      setShowManual(true);
      return;
    }
    const params = new URLSearchParams({
      client_id: facebookAppId,
      redirect_uri: redirectUri,
      scope: 'pages_show_list,instagram_manage_messages,pages_read_engagement',
      response_type: 'code',
      state: 'instagram_oauth',
    });
    window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  };

  // ── Manual connect ────────────────────────────────────────────────────────

  const manualConnectMutation = useMutation({
    mutationFn: async ({ pageAccessToken }: ManualFormValues) => {
      const res = await client.post({
        url: '/instagram/connect',
        body: { pageAccessToken },
        responseType: 'json',
      });
      return res.data as { instagramAccountId: string; username: string };
    },
    onSuccess: (data) => {
      setConnection({
        instagramAccountId: data.instagramAccountId,
        username: data.username,
        boundToAgentId: null,
        agentName: null,
      });
      reset();
      toast.success('Instagram Business Account connected');
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // ── Multi-account confirm ─────────────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: async (instagramAccountId: string) => {
      const res = await client.post({
        url: '/instagram/oauth/confirm',
        body: { pendingKey: pendingKey!, instagramAccountId },
        responseType: 'json',
      });
      return res.data as { instagramAccountId: string; username: string };
    },
    onSuccess: (data) => {
      setConnection({
        instagramAccountId: data.instagramAccountId,
        username: data.username,
        boundToAgentId: null,
        agentName: null,
      });
      toast.success('Instagram account connected');
      onClose();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setPendingKey(null);
      setPendingAccounts([]);
    },
  });

  // ── Account picker (shown when OAuth returns multiple pages) ──────────────
  if (pendingKey && pendingAccounts.length > 0) {
    return (
      <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Choose an Instagram Account</SheetTitle>
          <SheetDescription>
            Multiple Instagram Business Accounts are linked to your Facebook. Pick one to connect.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 px-4 py-4">
          {pendingAccounts.map((account) => (
            <button
              key={account.instagramAccountId}
              type="button"
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate(account.instagramAccountId)}
              className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                <span className="text-xs font-bold text-white">IG</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">@{account.username}</p>
                <p className="text-xs text-muted-foreground truncate">{account.pageName}</p>
              </div>
            </button>
          ))}
        </div>
        <SheetFooter className="border-t px-4 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setPendingKey(null);
              setPendingAccounts([]);
            }}
          >
            Back
          </Button>
        </SheetFooter>
      </SheetContent>
    );
  }

  // ── Main panel ────────────────────────────────────────────────────────────
  return (
    <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
      <SheetHeader>
        <SheetTitle>Connect Instagram</SheetTitle>
        <SheetDescription>
          Connect your Instagram Business Account to start handling DMs.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 px-4 py-4">
        {/* ── Facebook Login (primary) ─────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recommended
          </p>
          <Button
            className="w-full gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
            onClick={handleFacebookLogin}
          >
            <FacebookLogo />
            Continue with Facebook
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Automatically finds your Instagram Business Account from your Facebook Pages.
            No token copy-pasting required.
          </p>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        {/* ── Manual setup (collapsible) ───────────────────────────────── */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {showManual ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            Manual Setup
          </button>

          {showManual && (
            <div className="space-y-4">
              <div className="space-y-3">
                <SetupStep number={1} title="Prepare your Instagram Business Account">
                  <p className="text-xs text-muted-foreground">
                    Your Instagram account must be a{' '}
                    <strong>Business or Creator account</strong> connected to a{' '}
                    <strong>Facebook Page</strong>.
                  </p>
                </SetupStep>

                <SetupStep number={2} title="Create a Meta App & configure webhook">
                  <p className="text-xs text-muted-foreground mb-2">
                    Go to{' '}
                    <a
                      href="https://developers.facebook.com/apps/create/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                    >
                      Meta for Developers <ExternalLink className="size-2.5" />
                    </a>{' '}
                    → Create App → Business → add <strong>Instagram Graph API</strong>. Then set
                    the webhook to:
                  </p>
                  <div className="space-y-2">
                    <CopyField label="Callback URL" value={setupInfo?.webhookUrl ?? ''} loading={!setupInfo} />
                    <CopyField label="Verify Token" value={setupInfo?.verifyToken ?? ''} loading={!setupInfo} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Subscribe to the <strong>messages</strong> webhook field.
                  </p>
                </SetupStep>

                <SetupStep number={3} title="Generate your token">
                  <p className="text-xs text-muted-foreground">
                    In Meta Business Manager → <strong>System Users</strong> → select your system user →{' '}
                    <strong>Generate token</strong> → select your app → check{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">instagram_manage_messages</code>{' '}
                    + <code className="rounded bg-muted px-1 py-0.5 text-[10px]">pages_show_list</code>{' '}
                    + <code className="rounded bg-muted px-1 py-0.5 text-[10px]">pages_read_engagement</code>.
                    Copy the token and paste it below.
                  </p>
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                    ⚠ The Instagram Account ID is no longer needed — we resolve it automatically from your token.
                  </p>
                </SetupStep>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <FormInput
                    name="pageAccessToken"
                    control={control}
                    label="Access Token"
                    type="password"
                    placeholder="EAAxxxxxxxx…"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    System User token or Page Access Token — we'll find your Instagram account automatically
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <SheetFooter className="border-t px-4 pt-4">
          <Button
            disabled={manualConnectMutation.isPending}
            onClick={handleSubmit((values) => manualConnectMutation.mutate(values))}
          >
            {manualConnectMutation.isPending ? 'Connecting…' : 'Connect'}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      )}
    </SheetContent>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SetupStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {number}
      </span>
      <div className="space-y-1.5 min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        {children}
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-mono">
        <span className={`flex-1 truncate ${loading ? 'animate-pulse text-muted-foreground' : ''}`}>
          {loading ? 'Loading…' : value}
        </span>
        <button
          type="button"
          onClick={copy}
          disabled={loading || !value}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
