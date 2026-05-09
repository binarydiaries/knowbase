import * as amplitude from '@amplitude/unified';
import { useAuth } from '@clerk/clerk-react';
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
import ReactMarkdown from 'react-markdown';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { type PdfPreviewResult, previewPdf, savePdf } from '@/services/pdfService.ts';

type Step = 'select' | 'extracting' | 'preview';

type IPDFContentWidgetProps = {
  onClose?: () => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PDFContentWidget = ({ onClose }: IPDFContentWidgetProps) => {
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { addUpdateDocument } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [preview, setPreview] = useState<PdfPreviewResult | null>(null);
  const [extractError, setExtractError] = useState('');

  if (!agentId) throw new Error('agentId not available');

  const handleFileChange = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setTitle(selected.name.replace(/\.pdf$/i, '').trim() || 'Untitled PDF');
    setExtractError('');
  };

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      return previewPdf(file, agentId, getToken);
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
    mutationFn: async () => {
      if (!preview) throw new Error('No preview available');
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setTitleError('Title is required');
        throw new Error('Title is required');
      }
      return savePdf({ agentId, title: trimmedTitle, text: preview.markdown }, getToken);
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

  const isDragOver = useRef(false);

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
            <div className="grid gap-3">
              <label
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-10 text-center transition-colors cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30"
                onDragOver={(e) => {
                  e.preventDefault();
                  isDragOver.current = true;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  isDragOver.current = false;
                  const dropped = e.dataTransfer.files[0];
                  if (dropped?.type === 'application/pdf') {
                    handleFileChange(dropped);
                  } else if (dropped) {
                    setExtractError('Only PDF files are supported.');
                  }
                }}
              >
                <FileUp className="h-8 w-8 text-muted-foreground" />
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
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
              {extractError && (
                <p className="text-sm text-destructive">{extractError}</p>
              )}
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">Title</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError('');
                }}
                placeholder="Enter a title for this PDF..."
              />
              {titleError && <p className="text-sm text-destructive">{titleError}</p>}
            </div>
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
            <div className="grid gap-3">
              <label className="text-sm font-medium">Title</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError('');
                }}
                placeholder="Enter a title..."
              />
              {titleError && <p className="text-sm text-destructive">{titleError}</p>}
            </div>

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
              <label className="text-sm font-medium">Extracted text preview</label>
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
            <Button
              onClick={() => extractMutation.mutate()}
              disabled={!file || extractMutation.isPending}
            >
              {extractMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extract Text
            </Button>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
          </>
        )}

        {step === 'extracting' && (
          <Button variant="outline" disabled>
            Extracting…
          </Button>
        )}

        {step === 'preview' && (
          <>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
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
