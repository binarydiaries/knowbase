import * as amplitude from '@amplitude/unified';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Globe, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { client } from '@/services/client.gen.ts';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

type Step = 'enter' | 'fetching' | 'preview';

interface UrlPreview {
  title: string;
  charCount: number;
  preview: string;
  rawText: string;
}

const schema = z.object({
  url: z.string().url('Please enter a valid URL (e.g. https://example.com)'),
  title: z.string().min(1, 'Title is required'),
});
type FormValues = z.infer<typeof schema>;

export const URLContentWidget = ({ onClose }: { onClose?: () => void }) => {
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const { addUpdateDocument } = useDocuments();

  const [step, setStep] = useState<Step>('enter');
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [fetchError, setFetchError] = useState('');

  if (!agentId) throw new Error('agentId not available');

  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const urlValue = watch('url');

  const previewMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await client.post<UrlPreview, unknown>({
        url: '/documents/url/preview',
        body: { agentId, url: data.url },
      });
      return res.data;
    },
    onMutate: () => {
      setStep('fetching');
      setFetchError('');
    },
    onSuccess: (result, variables) => {
      if (!result) return;
      setPreview(result);
      if (!watch('title') || watch('title') === variables.url) {
        setValue('title', result.title);
      }
      setStep('preview');
    },
    onError: (error) => {
      setFetchError(getErrorMessage(error));
      setStep('enter');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!preview?.rawText)
        throw new Error(
          'No page content available. Please go back and fetch the page again.',
        );
      const saveRes = await client.post<{ document: unknown }, unknown>({
        url: '/documents/url',
        body: {
          agentId,
          title: data.title,
          url: data.url,
          rawText: preview.rawText,
        },
      });
      return saveRes.data;
    },
    onSuccess: (result) => {
      if (result && typeof result === 'object' && 'document' in result) {
        addUpdateDocument(
          agentId,
          (result as { document: Parameters<typeof addUpdateDocument>[1] })
            .document,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success('Website added as knowledge source');
      amplitude.track('Knowledge Source Added', {
        agent_id: agentId,
        source_type: 'url',
      });
      onClose?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onFetch = handleSubmit((data) => previewMutation.mutate(data));
  const onSave = handleSubmit((data) => saveMutation.mutate(data));

  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>Add Website URL</SheetTitle>
        <SheetDescription>
          Paste a public URL and we will extract the text content to use as a
          knowledge source.
        </SheetDescription>
      </SheetHeader>

      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        {(step === 'enter' || step === 'fetching') && (
          <>
            <FormInput
              name="url"
              control={control}
              label="URL"
              placeholder="https://example.com/faq"
            />
            <FormInput
              name="title"
              control={control}
              label="Title"
              placeholder="Enter a title for this source..."
            />
            {fetchError && (
              <p className="text-sm text-destructive">{fetchError}</p>
            )}
          </>
        )}

        {step === 'fetching' && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Fetching page content…</p>
          </div>
        )}

        {step === 'preview' && preview && (
          <>
            <FormInput
              name="title"
              control={control}
              label="Title"
              placeholder="Enter a title..."
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="truncate">{urlValue}</span>
              <span>·</span>
              <span>{preview.charCount.toLocaleString()} characters</span>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium">Content preview</p>
              <div className="rounded-md border border-input bg-muted/20 px-4 py-3 overflow-auto max-h-64 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {preview.preview}
                {preview.charCount > 500 && (
                  <span className="text-muted-foreground italic">
                    {'\n\n'}… and {(preview.charCount - 500).toLocaleString()}{' '}
                    more characters
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <SheetFooter>
        {step === 'enter' && (
          <>
            <Button onClick={onFetch} disabled={!urlValue}>
              Fetch Page
            </Button>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
          </>
        )}

        {step === 'fetching' && (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching…
          </Button>
        )}

        {step === 'preview' && (
          <>
            <Button onClick={onSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('enter')}
              disabled={saveMutation.isPending}
            >
              Back
            </Button>
          </>
        )}
      </SheetFooter>
    </SheetContent>
  );
};
