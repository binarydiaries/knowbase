import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@knowbase/ui/components/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { postChatbots } from '@/services';

const schema = z.object({
  name: z.string().min(3).max(20),
  description: z.string().min(3).max(200).optional(),
});

export function CreateChatbotDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const queryClient = useQueryClient();

  const createChatbotMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      await postChatbots({ body: { name, description } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });

      reset(); // ✅ reset happens AFTER success
      setOpen(false); // ✅ dialog closes AFTER reset
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(schema),
    mode: 'all',
  });
  function handleCreate(formValues: z.infer<typeof schema>) {
    createChatbotMutation.mutate({
      name: formValues.name,
      description: formValues.description ?? '',
    });
  }

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Chatbot</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Chatbot</DialogTitle>
          <DialogDescription>
            Give your chatbot a name. You can configure everything else later.
          </DialogDescription>
        </DialogHeader>

        <FormInput
          name="name"
          control={control}
          label="Name"
          placeholder="Enter name"
        />

        <FormInput
          name="description"
          control={control}
          label="Description"
          placeholder="Enter description"
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleCreate)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 text-white w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
