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
import { Loader2 } from 'lucide-react';
import * as React from 'react';

type CreateChatbotDialogProps = {
  onCreate?: (name: string, description: string) => void;
};

export function CreateChatbotDialog({ onCreate }: CreateChatbotDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  function handleCreate() {
    if (!name.trim()) return;

    setLoading(true);

    try {
      onCreate?.(name.trim(), desc.trim());
    } finally {
      setLoading(false);
      // reset + close
      setName('');
      setDesc('');
      setOpen(false);
    }
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
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 text-white w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
