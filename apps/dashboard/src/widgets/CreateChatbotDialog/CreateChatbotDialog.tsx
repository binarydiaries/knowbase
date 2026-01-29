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
import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import { Input } from '@knowbase/ui/components/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
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

        <Field data-invalid={errors.name?.message}>
          <FieldLabel>Name</FieldLabel>
          <Input {...register('name')} aria-invalid={!!errors.name?.message} />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.description?.message}>
          <FieldLabel>Description</FieldLabel>
          <Input
            {...register('description')}
            aria-invalid={!!errors.description?.message}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </Field>
        {/*<div className="grid gap-2 py-4">*/}
        {/*  <Label htmlFor="chatbot-name">Chatbot name</Label>*/}
        {/*  <Input*/}
        {/*    id="chatbot-name"*/}
        {/*    placeholder="eg., Customer Support Bot"*/}
        {/*    value={name}*/}
        {/*    onChange={(e) => setName(e.target.value)}*/}
        {/*    autoFocus*/}
        {/*  />*/}
        {/*</div>*/}
        {/*<div className="grid gap-2 ">*/}
        {/*  <Label htmlFor="chatbot-desc">Chatbot description</Label>*/}
        {/*  <Input*/}
        {/*    id="chatbot-desc"*/}
        {/*    placeholder="What will this chatbot do?"*/}
        {/*    value={desc}*/}
        {/*    onChange={(e) => setDesc(e.target.value)}*/}
        {/*  />*/}
        {/*</div>*/}

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
