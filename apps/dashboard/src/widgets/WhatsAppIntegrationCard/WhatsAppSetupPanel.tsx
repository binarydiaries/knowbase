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
import { useWhatsAppConnection } from '@/store/useWhatsAppConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const schema = z.object({
  businessAccountId: z.string().min(1, 'Business Account ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
});
type FormValues = z.infer<typeof schema>;

export function WhatsAppSetupPanel({ onClose }: { onClose: () => void }) {
  const { setConnection } = useWhatsAppConnection();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessAccountId: '', accessToken: '' },
  });

  const { data: setupInfo } = useQuery({
    queryKey: ['whatsapp-setup-info'],
    queryFn: async () => {
      const res = await client.get({
        url: '/whatsapp/setup-info',
        responseType: 'json',
      });
      return res.data as { webhookUrl: string; verifyToken: string };
    },
  });

  const connectMutation = useMutation({
    mutationFn: async ({ accessToken, businessAccountId }: FormValues) => {
      const res = await client.post({
        url: '/whatsapp/connect',
        body: { accessToken, businessAccountId },
        responseType: 'json',
      });
      return res.data as {
        businessAccountId: string;
        phoneNumbers: { phoneNumberId: string; displayPhone: string }[];
      };
    },
    onSuccess: (data) => {
      setConnection({
        businessAccountId: data.businessAccountId,
        phoneNumbers: data.phoneNumbers.map((p) => ({
          ...p,
          boundToAgentId: null,
          agentName: null,
        })),
      });
      reset();
      toast.success('WhatsApp Business Account connected');
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
      <SheetHeader>
        <SheetTitle>Connect WhatsApp Business</SheetTitle>
        <SheetDescription>
          Follow the steps below to connect your Meta WhatsApp Business Account.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 px-4 py-4">
        {/* Setup guide */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Setup guide
          </p>

          <SetupStep number={1} title="Create a Meta App">
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
              → Create App → Business type → add the <strong>WhatsApp</strong>{' '}
              product. Create or connect a WhatsApp Business Account (WABA) and
              add a verified phone number.
            </p>
          </SetupStep>

          <SetupStep number={2} title="Configure the Webhook">
            <p className="text-xs text-muted-foreground mb-2">
              In your Meta App →{' '}
              <strong>WhatsApp → Configuration → Webhooks</strong>, click{' '}
              <em>Edit</em> and enter these values:
            </p>
            <div className="space-y-2">
              <CopyField
                label="Callback URL"
                value={setupInfo?.webhookUrl ?? ''}
                loading={!setupInfo}
              />
              <CopyField
                label="Verify Token"
                value={setupInfo?.verifyToken ?? ''}
                loading={!setupInfo}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click <em>Verify and Save</em>, then subscribe to the{' '}
              <strong>messages</strong> webhook field.
            </p>
          </SetupStep>

          <SetupStep number={3} title="Get your credentials">
            <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
              <li>
                <span className="font-medium text-foreground">
                  Business Account ID
                </span>{' '}
                — Meta Business Manager → Business Settings → Business Info.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Access Token
                </span>{' '}
                — Go to{' '}
                <a
                  href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started/system-users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                >
                  System Users
                  <ExternalLink className="size-2.5" />
                </a>{' '}
                → Create an Admin System User → assign your WABA as an asset →
                generate a token with permissions:{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  whatsapp_business_messaging
                </code>{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  whatsapp_business_management
                </code>
              </li>
            </ul>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
              ⚠ Do not use the temporary token from the API Setup page — it
              expires in 24 hours and will silently break your integration.
            </p>
          </SetupStep>

          <SetupStep number={4} title="Enter your credentials below" />
        </div>

        <Separator />

        {/* Credentials form */}
        <div className="space-y-3">
          <div>
            <FormInput
              name="businessAccountId"
              control={control}
              label="Business Account ID"
              placeholder="1234567890"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Found in Meta Business Manager → Business Settings → Business Info
            </p>
          </div>
          <div>
            <FormInput
              name="accessToken"
              control={control}
              label="Access Token"
              type="password"
              placeholder="EAAxxxxxxxx…"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use a System User permanent token — temporary tokens expire in 24
              hours
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
        <span
          className={`flex-1 truncate ${loading ? 'animate-pulse text-muted-foreground' : ''}`}
        >
          {loading ? 'Loading…' : value}
        </span>
        <button
          type="button"
          onClick={copy}
          disabled={loading || !value}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
