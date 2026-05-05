import { zodResolver } from '@hookform/resolvers/zod';
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
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink, LockIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from '@tanstack/react-router';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { useClerkPlan } from '@/hooks/useClerkPlan.ts';
import { client } from '@/services/client.gen';
import {
  useWhatsAppConnection,
  type WhatsAppPhoneNumber,
} from '@/store/useWhatsAppConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  businessAccountId?: string;
  phoneNumbers: WhatsAppPhoneNumber[];
}

const schema = z.object({
  businessAccountId: z.string().min(1, 'Business Account ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
});
type FormValues = z.infer<typeof schema>;

export function WhatsAppIntegrationCard() {
  const { connected, phoneNumbers, setConnection, clearConnection } =
    useWhatsAppConnection();
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessAccountId: '', accessToken: '' },
  });

  const { isLoading } = useQuery({
    queryKey: ['whatsapp-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/whatsapp/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.businessAccountId) {
        setConnection({
          businessAccountId: data.businessAccountId,
          phoneNumbers: data.phoneNumbers,
        });
      }
      return data;
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
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await client.delete({
        url: '/whatsapp/connection',
        responseType: 'json',
      });
    },
    onSuccess: () => {
      clearConnection();
      toast.success('WhatsApp disconnected');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* WhatsApp logo */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]">
            <svg
              viewBox="0 0 24 24"
              className="size-6 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">WhatsApp Business</CardTitle>
            <CardDescription className="text-sm">
              {connected
                ? 'Your WhatsApp Business Account is connected.'
                : 'Enter your Meta credentials to connect your WABA.'}
            </CardDescription>
          </div>
        </div>
        {isPaid && connected && (
          <Badge
            variant="outline"
            className="shrink-0 text-green-600 border-green-300 bg-green-50"
          >
            <span className="size-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
            Connected
          </Badge>
        )}
      </CardHeader>

      {!planLoading && !isPaid && (
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="rounded-full border p-3">
            <LockIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            WhatsApp Business integration is available on paid plans. Upgrade to connect your account.
          </p>
          <Button size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </CardContent>
      )}

      {isPaid && !connected && !isLoading && (
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <FormInput
              name="businessAccountId"
              control={control}
              label="Business Account ID"
              placeholder="1234567890"
            />
            <FormInput
              name="accessToken"
              control={control}
              label="Access Token"
              type="password"
              placeholder="EAAxxxxxxxx…"
            />
          </div>
          <div className="flex items-center justify-between">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              How to get these
            </a>
            <Button
              size="sm"
              disabled={connectMutation.isPending}
              onClick={handleSubmit((values) => connectMutation.mutate(values))}
            >
              {connectMutation.isPending ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      )}

      {isPaid && connected && (
        <CardContent className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Phone Numbers
            </p>
            {phoneNumbers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No phone numbers found in this account.
              </p>
            ) : (
              <div className="space-y-2">
                {phoneNumbers.map((phone) => (
                  <PhoneNumberRow key={phone.phoneNumberId} phone={phone} />
                ))}
              </div>
            )}
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
                    'This will disable all WhatsApp channels across your agents. Continue?',
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

function PhoneNumberRow({ phone }: { phone: WhatsAppPhoneNumber }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span className="font-medium">{phone.displayPhone}</span>
      {phone.boundToAgentId ? (
        <Badge variant="secondary">{phone.agentName ?? 'Bound'}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      )}
    </div>
  );
}
