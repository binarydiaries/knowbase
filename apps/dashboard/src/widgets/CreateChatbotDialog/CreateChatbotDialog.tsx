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
import { patchChatbotsById, postChatbots } from '@/services';

const schema = z.object({
  name: z.string().min(3).max(20),
  description: z.string().min(3).max(200).optional(),
});

export function CreateChatbotDialog({
  open,
  setOpen,
  chatbot,
  onClose,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  chatbot?: any;
  onClose?: () => void;
}) {
  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(schema),
    mode: 'all',
  });

  useEffect(() => {
    if (chatbot) {
      reset({
        name: chatbot.name,
        description: chatbot.description ?? '',
      });
    }
  }, [chatbot, reset]);

  const queryClient = useQueryClient();

  const createChatbotMutation1 = useMutation({
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
    },
    onError: () => {},
  });
  const createOrUpdateMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (chatbot) {
        // ✨ EDIT
        return patchChatbotsById({
          path: { id: chatbot.id },
          body: { name, description },
        });
      }

      // ✨ CREATE
      return postChatbots({ body: { name, description } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      reset();
      setOpen(false);
      onClose?.();
    },
  });

  const { isPending } = createOrUpdateMutation;

  function handleCreate(formValues: z.infer<typeof schema>) {
    createOrUpdateMutation.mutate({
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
          <DialogTitle>
            {chatbot ? 'Edit Chatbot' : 'Create Chatbot'}
          </DialogTitle>

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
          <Button onClick={handleSubmit(handleCreate)} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {chatbot ? 'Updating…' : 'Creating…'}
              </>
            ) : chatbot ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
