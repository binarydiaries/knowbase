import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@knowbase/ui/components/dialog';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import * as React from 'react';

type CreateChatbotDialogProps = {
  onCreate?: (name: string, description: string) => void;
};

export function CreateChatbotDialog({ onCreate }: CreateChatbotDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');

  function handleCreate() {
    if (!name.trim()) return;

    onCreate?.(name.trim(), desc.trim());

    // reset + close
    setName('');
    setDesc('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Chatbot</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Chatbot</DialogTitle>
          <DialogDescription>
            Give your chatbot a name. You can configure everything else later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          <Label htmlFor="chatbot-name">Chatbot name</Label>
          <Input
            id="chatbot-name"
            placeholder="eg., Customer Support Bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid gap-2 ">
          <Label htmlFor="chatbot-desc">Chatbot description</Label>
          <Input
            id="chatbot-desc"
            placeholder="What will this chatbot do?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
