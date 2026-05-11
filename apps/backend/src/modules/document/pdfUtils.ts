import { getDocumentProxy } from 'unpdf';

const MAX_PDF_CHARS = 200_000;
const LINE_MERGE_THRESHOLD = 2;
const HEADING_SCALE_H1 = 2.0;
const HEADING_SCALE_H2 = 1.4;
const HEADING_SCALE_H3 = 1.2;

export async function pdfToMarkdown(buffer: Uint8Array) {
  const pdf = await getDocumentProxy(buffer);
  const totalPages = pdf.numPages;
  const pageMarkdowns: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    type RawItem = { str: string; transform: number[] };
    type LineItem = { str: string; y: number; height: number };

    const items: LineItem[] = (content.items as RawItem[])
      .filter((item) => item.str?.trim())
      .map((item) => ({
        str: item.str,
        y: item.transform[5],
        height: Math.abs(item.transform[3]),
      }));

    if (!items.length) continue;

    // Group items that share the same Y position into lines
    const lines: { text: string; height: number }[] = [];
    let current = { text: items[0].str, y: items[0].y, height: items[0].height };
    for (const item of items.slice(1)) {
      if (Math.abs(item.y - current.y) <= LINE_MERGE_THRESHOLD) {
        current.text += item.str;
        current.height = Math.max(current.height, item.height);
      } else {
        lines.push({ text: current.text.trim(), height: current.height });
        current = { text: item.str, y: item.y, height: item.height };
      }
    }
    lines.push({ text: current.text.trim(), height: current.height });

    // Modal font height = body text baseline
    const freq: Record<number, number> = {};
    for (const h of lines.map((l) => Math.round(l.height))) {
      freq[h] = (freq[h] ?? 0) + 1;
    }
    const bodyHeight = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);

    const mdLines = lines
      .filter((l) => l.text)
      .map((l) => {
        if (bodyHeight <= 0) return l.text;
        const ratio = l.height / bodyHeight;
        if (ratio >= HEADING_SCALE_H1) return `# ${l.text}`;
        if (ratio >= HEADING_SCALE_H2) return `## ${l.text}`;
        if (ratio >= HEADING_SCALE_H3) return `### ${l.text}`;
        return l.text;
      });

    pageMarkdowns.push(mdLines.join('\n'));
  }

  const fullMarkdown = pageMarkdowns.join('\n\n');
  const truncated = fullMarkdown.length > MAX_PDF_CHARS;
  return {
    markdown: fullMarkdown.slice(0, MAX_PDF_CHARS),
    pages: totalPages,
    characters: fullMarkdown.length,
    truncated,
  };
}
