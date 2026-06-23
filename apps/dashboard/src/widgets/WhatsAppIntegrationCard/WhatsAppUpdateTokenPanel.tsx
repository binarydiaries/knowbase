import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { client } from '@/services/client.gen';
import { useWhatsAppConnection } from '@/store/useWhatsAppConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const schema = z.object({
  accessToken: z.string().min(1, 'Access Token is required'),
});
type FormValues = z.infer<typeof schema>;

export function WhatsAppUpdateTokenPanel({ onClose }: { onClose: () => void }) {
  const { businessAccountId, setConnection } = useWhatsAppConnection();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accessToken: '' },
  });

  const updateTokenMutation = useMutation({
    mutationFn: async ({ accessToken }: FormValues) => {
      const res = await client.post({
        url: '/whatsapp/connection/token',
        body: { accessToken },
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
        phoneNumbers: data.phoneNumbers.map((p) => ({ ...p, boundToAgentId: null, agentName: null })),
      });
      reset();
      toast.success('Access token updated');
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <SheetContent className="sm:max-w-lg overflow-y-auto flex flex-col">
      <SheetHeader>
        <SheetTitle>Update Access Token</SheetTitle>
        <SheetDescription>
          Rotate the access token for your existing WhatsApp Business Account
          {businessAccountId ? ` (${businessAccountId})` : ''}. Phone number bindings stay unchanged.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 px-4 py-4">
        <div>
          <FormInput
            name="accessToken"
            control={control}
            label="New Access Token"
            type="password"
            placeholder="EAAxxxxxxxx…"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Use a System User permanent token — temporary tokens expire in 24 hours
          </p>
        </div>
      </div>

      <SheetFooter className="border-t px-4 pt-4">
        <Button
          disabled={updateTokenMutation.isPending}
          onClick={handleSubmit((values) => updateTokenMutation.mutate(values))}
        >
          {updateTokenMutation.isPending ? 'Updating…' : 'Update Token'}
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
