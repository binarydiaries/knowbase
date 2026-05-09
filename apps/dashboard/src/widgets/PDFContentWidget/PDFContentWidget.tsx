import * as amplitude from '@amplitude/unified';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@knowbase/ui/components/alert';
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
import { AlertTriangle, FileUp, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { client } from '@/services/client.gen.ts';
import { formDataBodySerializer } from '@/services/core/bodySerializer.gen.ts';
import type { DocumentSchema } from '@/services';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z
    .instanceof(File, { message: 'Please select a PDF file' })
    .refine((f) => f.type === 'application/pdf', 'Only PDF files are accepted')
    .refine((f) => f.size <= MAX_FILE_BYTES, 'PDF must be under 50 MB'),
});
type FormValues = z.infer<typeof schema>;

type PdfPreviewResult = {
  markdown: string;
  pages: number;
  characters: number;
  truncated: boolean;
};

type Step = 'select' | 'extracting' | 'preview';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PDFContentWidget = ({ onClose }: { onClose?: () => void }) => {
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const { addUpdateDocument } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [preview, setPreview] = useState<PdfPreviewResult | null>(null);
  const [extractError, setExtractError] = useState('');

  if (!agentId) throw new Error('agentId not available');

  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const fileValue = watch('file');
  const titleValue = watch('title');

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setValue('file', file, { shouldValidate: true });
    if (!titleValue) {
      setValue('title', file.name.replace(/\.pdf$/i, '').trim() || 'Untitled PDF');
    }
    setExtractError('');
  };

  const extractMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { data: result } = await client.post<PdfPreviewResult, unknown>({
        url: '/documents/pdf/preview',
        body: { file: data.file, agentId },
        ...formDataBodySerializer,
        responseType: 'json',
      });
      return result;
    },
    onMutate: () => {
      setStep('extracting');
      setExtractError('');
    },
    onSuccess: (result) => {
      setPreview(result);
      setStep('preview');
    },
    onError: (error) => {
      setExtractError(getErrorMessage(error));
      setStep('select');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!preview) throw new Error('No preview available');
      const { data: result } = await client.post<{ document: DocumentSchema }, unknown>({
        url: '/documents/pdf',
        body: { agentId, title: data.title, text: preview.markdown },
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json',
      });
      return result;
    },
    onSuccess: ({ document: saved }) => {
      addUpdateDocument(agentId, saved);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success('PDF uploaded');
      amplitude.track('Knowledge Source Added', { agent_id: agentId, source_type: 'pdf' });
      onClose?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onExtract = handleSubmit((data) => extractMutation.mutate(data));
  const onSave = handleSubmit((data) => saveMutation.mutate(data));

  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>Upload PDF</SheetTitle>
        <SheetDescription>
          Text will be extracted from your PDF and used as a knowledge source.
        </SheetDescription>
      </SheetHeader>

      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        {step === 'select' && (
          <>
            <Controller
              control={control}
              name="file"
              render={({ fieldState }) => (
                <div className="grid gap-2">
                  <label
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-10 text-center transition-colors cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.files[0];
                      if (dropped?.type === 'application/pdf') {
                        handleFileChange(dropped);
                      } else if (dropped) {
                        setExtractError('Only PDF files are supported.');
                      }
                    }}
                  >
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    {fileValue ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{fileValue.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(fileValue.size)}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
                        <p className="text-xs text-muted-foreground">Up to 50 MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="sr-only"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                  {extractError && (
                    <p className="text-sm text-destructive">{extractError}</p>
                  )}
                </div>
              )}
            />

            <FormInput
              name="title"
              control={control}
              label="Title"
              placeholder="Enter a title for this PDF..."
            />
          </>
        )}

        {step === 'extracting' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Extracting text from PDF…</p>
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

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{preview.pages} {preview.pages === 1 ? 'page' : 'pages'}</span>
              <span>·</span>
              <span>{preview.characters.toLocaleString()} characters</span>
            </div>

            {preview.truncated && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>PDF truncated</AlertTitle>
                <AlertDescription>
                  This PDF exceeds 200,000 characters. Only the first portion will be indexed.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <p className="text-sm font-medium">Extracted text preview</p>
              <div className="prose prose-sm max-w-none rounded-md border border-input bg-muted/20 px-4 py-3 overflow-auto max-h-72 text-sm text-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                <ReactMarkdown>{preview.markdown}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>

      <SheetFooter>
        {step === 'select' && (
          <>
            <Button onClick={onExtract} disabled={!fileValue}>
              Extract Text
            </Button>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
          </>
        )}

        {step === 'extracting' && (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting…
          </Button>
        )}

        {step === 'preview' && (
          <>
            <Button onClick={onSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('select')}
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
