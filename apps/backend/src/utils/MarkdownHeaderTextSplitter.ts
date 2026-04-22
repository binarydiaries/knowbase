type HeaderTuple = [string, string];

type DocumentChunk = {
  pageContent: string;
  metadata: Record<string, string>;
};

export class MarkdownHeaderTextSplitter {
  private headers: { level: number; key: string }[];

  constructor(headersToSplitOn: HeaderTuple[]) {
    this.headers = headersToSplitOn.map(([token, key]) => ({
      level: token.length,
      key,
    }));
  }

  splitText(text: string): DocumentChunk[] {
    const lines = text.split('\n');
    const documents: DocumentChunk[] = [];

    let currentLines: string[] = [];
    const headerContext: Record<number, string> = {};
    let inCodeBlock = false;

    const flush = () => {
      const content = currentLines.join('\n').trim();
      if (!content) return;

      const metadata: Record<string, string> = {};
      for (const h of this.headers) {
        if (headerContext[h.level]) {
          metadata[h.key] = headerContext[h.level];
        }
      }

      documents.push({
        pageContent: content
          .replace(/\n?---\n?/g, '') // remove thematic breaks
          .trim(),
        metadata,
      });

      currentLines = [];
    };

    for (const line of lines) {
      // Toggle code-fence tracking so that `#` inside code blocks
      // is never misidentified as a markdown header.
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        currentLines.push(line);
        continue;
      }

      if (inCodeBlock) {
        currentLines.push(line);
        continue;
      }

      const match = line.match(/^(#{1,6})\s+(.*)$/);

      if (match) {
        const level = match[1].length;
        const title = match[2].trim();

        const tracked = this.headers.find((h) => h.level === level);

        if (tracked) {
          flush();

          // Clear deeper headers (LangChain behaviour)
          Object.keys(headerContext)
            .map(Number)
            .filter((l) => l >= level)
            .forEach((l) => {
              delete headerContext[l];
            });

          headerContext[level] = title;
          continue;
        }
      }

      currentLines.push(line);
    }

    flush();
    return documents;
  }
}
