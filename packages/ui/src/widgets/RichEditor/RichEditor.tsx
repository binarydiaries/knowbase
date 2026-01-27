import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
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
import type { EditorState } from 'lexical';
import { useEffect, useState } from 'react';
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

const editorConfig: InitialConfigType = {
  namespace: 'React.js Demo',
  nodes: [HeadingNode],
  onError(error: Error) {
    throw error;
  },
  theme: editorTheme,
};

export function RichEditor() {
  const [editorState, setEditorState] = useState('');

  console.log(editorState);

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
          <MyOnChangePlugin onChange={setEditorState} />
        </div>
      </div>
    </LexicalComposer>
  );
}
