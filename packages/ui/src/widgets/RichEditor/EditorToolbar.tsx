import { type Editor, useEditorState } from '@tiptap/react';
import {
  Bold,
  Code,
  Code2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  UnderlineIcon,
  Undo,
} from 'lucide-react';
import { Button } from '../../components/button';
import { Separator } from '../../components/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/select';
import { Toggle } from '../../components/toggle';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isUnderline: ctx.editor?.isActive('underline') ?? false,
      isStrike: ctx.editor?.isActive('strike') ?? false,
      isCode: ctx.editor?.isActive('code') ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
      isBlockquote: ctx.editor?.isActive('blockquote') ?? false,
      isCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
      isLink: ctx.editor?.isActive('link') ?? false,
      isH1: ctx.editor?.isActive('heading', { level: 1 }) ?? false,
      isH2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
      isH3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
      canUndo: ctx.editor?.can().undo() ?? false,
      canRedo: ctx.editor?.can().redo() ?? false,
    }),
  });

  if (!editor || !state) return null;

  const blockType = state.isH1 ? 'h1' : state.isH2 ? 'h2' : state.isH3 ? 'h3' : 'paragraph';

  const setBlockType = (value: string) => {
    switch (value) {
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      default:
        editor.chain().focus().setParagraph().run();
    }
  };

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previous ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-0.5 px-2 py-1 border-b border-input items-center">
      {/* Undo / Redo */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state.canUndo}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state.canRedo}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 mx-0.5" />

      {/* Block type */}
      <Select value={blockType} onValueChange={setBlockType}>
        <SelectTrigger className="h-8 w-[130px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="paragraph">Normal</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 mx-0.5" />

      {/* Inline formatting */}
      <Toggle
        size="sm"
        pressed={state.isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isUnderline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isStrike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isCode}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        title="Inline code"
      >
        <Code />
      </Toggle>

      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 mx-0.5" />

      {/* Lists */}
      <Toggle
        size="sm"
        pressed={state.isBulletList}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isOrderedList}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered list"
      >
        <ListOrdered />
      </Toggle>

      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 mx-0.5" />

      {/* Blockquote & code block */}
      <Toggle
        size="sm"
        pressed={state.isBlockquote}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isCodeBlock}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        <Code2 />
      </Toggle>

      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 mx-0.5" />

      {/* Link */}
      <Toggle
        size="sm"
        pressed={state.isLink}
        onPressedChange={setLink}
        title="Link"
      >
        <Link />
      </Toggle>
    </div>
  );
}
