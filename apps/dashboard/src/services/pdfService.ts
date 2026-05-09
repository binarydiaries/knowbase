import type { DocumentSchema } from '@/services';

const apiBase = () => import.meta.env.VITE_API_BASE as string;

async function apiFetch(
  path: string,
  options: RequestInit,
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { message?: string }).message ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export type PdfPreviewResult = {
  markdown: string;
  pages: number;
  characters: number;
  truncated: boolean;
};

export async function previewPdf(
  file: File,
  agentId: string,
  getToken: () => Promise<string | null>,
): Promise<PdfPreviewResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('agentId', agentId);
  return apiFetch('/documents/pdf/preview', { method: 'POST', body: form }, getToken);
}

export async function savePdf(
  params: { agentId: string; title: string; text: string },
  getToken: () => Promise<string | null>,
): Promise<{ document: DocumentSchema }> {
  return apiFetch(
    '/documents/pdf',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    getToken,
  );
}
