import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';

interface IRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function RichEditor({
  value,
  onChange,
  readOnly = false,
}: IRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: 'Enter some rich text...' }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getMarkdown());
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div className="border border-input rounded-md overflow-hidden">
      {!readOnly && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="tiptap-editor px-3 py-2" />
    </div>
  );
}
