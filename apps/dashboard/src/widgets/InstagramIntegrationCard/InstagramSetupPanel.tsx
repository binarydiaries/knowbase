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
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { client } from '@/services/client.gen';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const schema = z.object({
  instagramAccountId: z.string().min(1, 'Instagram Account ID is required'),
  pageAccessToken: z.string().min(1, 'Page Access Token is required'),
});
type FormValues = z.infer<typeof schema>;

export function InstagramSetupPanel({ onClose }: { onClose: () => void }) {
  const { setConnection } = useInstagramConnection();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { instagramAccountId: '', pageAccessToken: '' },
  });

  const { data: setupInfo } = useQuery({
    queryKey: ['instagram-setup-info'],
    queryFn: async () => {
      const res = await client.get({ url: '/instagram/setup-info', responseType: 'json' });
      return res.data as { webhookUrl: string; verifyToken: string };
    },
  });

  const connectMutation = useMutation({
    mutationFn: async ({ pageAccessToken, instagramAccountId }: FormValues) => {
      const res = await client.post({
        url: '/instagram/connect',
        body: { pageAccessToken, instagramAccountId },
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

  return (
    <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
      <SheetHeader>
        <SheetTitle>Connect Instagram</SheetTitle>
        <SheetDescription>
          Follow the steps below to connect your Instagram Business Account via the Meta Graph API.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 px-4 py-4">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Setup guide
          </p>

          <SetupStep number={1} title="Prepare your Instagram Business Account">
            <p className="text-xs text-muted-foreground">
              Your Instagram account must be a{' '}
              <strong>Business or Creator account</strong> and connected to a{' '}
              <strong>Facebook Page</strong>. You can do this in Instagram Settings →{' '}
              Account → Switch to professional account, then link a Facebook Page.
            </p>
          </SetupStep>

          <SetupStep number={2} title="Create a Meta App">
            <p className="text-xs text-muted-foreground">
              Go to{' '}
              <a
                href="https://developers.facebook.com/apps/create/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
              >
                Meta for Developers
                <ExternalLink className="size-2.5" />
              </a>{' '}
              → Create App → Business type → add the <strong>Instagram Graph API</strong> product.
              Connect your Facebook Page and Instagram account to the app.
            </p>
          </SetupStep>

          <SetupStep number={3} title="Configure the Webhook">
            <p className="text-xs text-muted-foreground mb-2">
              In your Meta App → <strong>Instagram → Configuration → Webhooks</strong>, click{' '}
              <em>Edit</em> and enter these values:
            </p>
            <div className="space-y-2">
              <CopyField label="Callback URL" value={setupInfo?.webhookUrl ?? ''} loading={!setupInfo} />
              <CopyField label="Verify Token" value={setupInfo?.verifyToken ?? ''} loading={!setupInfo} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click <em>Verify and Save</em>, then subscribe to the <strong>messages</strong> webhook field.
            </p>
          </SetupStep>

          <SetupStep number={4} title="Get your credentials">
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li>
                <span className="font-medium text-foreground">Instagram Account ID</span>{' '}
                — In Meta App → Instagram → Basic Display, your Instagram Business Account ID
                is listed under the connected account. You can also get it via the Graph API Explorer:
                call <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GET /me?fields=id</code> with
                your Page Access Token.
              </li>
              <li>
                <span className="font-medium text-foreground">Page Access Token</span>{' '}
                — Go to{' '}
                <a
                  href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                >
                  System Users
                  <ExternalLink className="size-2.5" />
                </a>{' '}
                in Meta Business Manager → create an Admin System User → assign your Page as an
                asset → generate a never-expiring token with{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  instagram_manage_messages
                </code>{' '}
                permission.
              </li>
            </ul>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
              ⚠ Temporary tokens expire in 1–2 hours. Always use a System User permanent token.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Note: To use with non-test users your Meta App must pass App Review for the{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">instagram_manage_messages</code> permission.
            </p>
          </SetupStep>

          <SetupStep number={5} title="Enter your credentials below" />
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <FormInput
              name="instagramAccountId"
              control={control}
              label="Instagram Account ID"
              placeholder="17841400000000000"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Numeric ID of your Instagram Business Account
            </p>
          </div>
          <div>
            <FormInput
              name="pageAccessToken"
              control={control}
              label="Page Access Token"
              type="password"
              placeholder="EAAxxxxxxxx…"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use a System User permanent token with instagram_manage_messages permission
            </p>
          </div>
        </div>
      </div>

      <SheetFooter className="border-t px-4 pt-4">
        <Button
          disabled={connectMutation.isPending}
          onClick={handleSubmit((values) => connectMutation.mutate(values))}
        >
          {connectMutation.isPending ? 'Connecting…' : 'Connect'}
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}

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
