import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import {
  type InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { useEffect, useRef } from 'react';
import { editorTheme } from './ExampleTheme';
import ToolbarPlugin from './ToolbarPlugin';

const placeholder = 'Enter some rich text...';

function MyOnChangePlugin({
  onChange,
}: {
  onChange: (markdown: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange(markdown);
      });
    });
  }, [editor, onChange]);

  return null;
}

function InitialMarkdownPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!value) return;

    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS);
    });
  }, [editor, value]);

  return null;
}

const editorConfig: InitialConfigType = {
  namespace: 'editor',
  nodes: [HeadingNode],
  onError(error: Error) {
    throw error;
  },
  theme: editorTheme,
};

interface IRichEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichEditor({ value, onChange }: IRichEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border border-input rounded-md overflow-hidden">
        <ToolbarPlugin />

        <div className="editor-inner relative left-3 top-2">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-37.5 outline-0 py-1 pb-4"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="absolute top-1 left-0 text-gray-400 text-base text-muted-foreground">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <HistoryPlugin />
          <AutoFocusPlugin />

          {/* 👇 Inject initial markdown */}
          <InitialMarkdownPlugin value={value} />

          {/* 👇 Emit markdown changes */}
          <MyOnChangePlugin onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}
