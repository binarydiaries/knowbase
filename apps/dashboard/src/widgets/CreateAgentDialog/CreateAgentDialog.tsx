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
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AGENT_LIMIT_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { type AgentSchema, patchAgentsById, postAgents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must be at most 30 characters'),
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be at most 200 characters')
    .optional(),
});

export function CreateAgentDialog({
  open,
  setOpen,
  agent,
  onClose,
  disabled = false,
  disabledReason = AGENT_LIMIT_TOOLTIP,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  agent?: AgentSchema;
  onClose?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const posthog = usePostHog();
  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(schema),
    mode: 'all',
  });

  useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description ?? '',
      });
    }
  }, [agent, reset]);

  const queryClient = useQueryClient();

  const createOrUpdateMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (agent) {
        // ✨ EDIT
        return patchAgentsById({
          path: { id: agent.id },
          body: { name, description, agentStatus: agent?.agentStatus },
        });
      }

      // ✨ CREATE
      return postAgents({ body: { name, description } });
    },
    onSuccess: (_, variables) => {
      if (agent) {
        posthog.capture('agent_updated', {
          agent_id: agent.id,
          agent_name: variables.name,
        });
        toast.success('Agent updated');
      } else {
        posthog.capture('agent_created', {
          agent_name: variables.name,
        });
        toast.success('Agent created');
      }
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      reset();
      setOpen(false);
      onClose?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
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
    if (open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {disabled ? (
        <DisabledTooltip content={disabledReason} disabled>
          <Button size="sm" disabled={disabled}>
            Add Agent
          </Button>
        </DisabledTooltip>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm">Add Agent</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Create Agent'}</DialogTitle>

          <DialogDescription>
            Give your agent a name. You can configure everything else later.
          </DialogDescription>
        </DialogHeader>

        <FormInput
          name="name"
          control={control}
          label="Name"
          placeholder="Enter name"
        />
        <FormTextarea
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
                {agent ? 'Updating…' : 'Creating…'}
              </>
            ) : agent ? (
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
