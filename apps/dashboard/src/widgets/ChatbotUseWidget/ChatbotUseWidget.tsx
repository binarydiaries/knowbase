import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@knowbase/ui/components/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@knowbase/ui/components/tabs';
import { useParams } from '@tanstack/react-router';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useChannels } from '@/store/useChannels.ts';

export const ChatbotUseWidget = () => {
  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const { chatbotId } = useParams({ strict: false });
  if (!chatbotId) {
    throw new Error('ChatbotId not available');
  }
  const channelWeb = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );
  const embedCode = `<script>
window.KnowBaseChat = {
  channelId: ${channelWeb?.id || ''},
};
</script>
<script src="/Users/shridhar/Documents/Keshav/knowbase/apps/embed/dist/embed.js" async></script>`;

  return (
    <Dialog>
      <DialogTrigger>
        <Button size="sm" variant="outline">
          Use Chabot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Use this chatbot</DialogTitle>
          <DialogDescription>
            Add this chatbot to your product or connect it to a channel.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="web">
          <TabsList>
            <TabsTrigger value="web">Web</TabsTrigger>
            <TabsTrigger value="whatsapp" disabled>
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Web */}
          <TabsContent value="web" className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Embed on your website</div>
              <div className="text-sm text-muted-foreground">
                Copy and paste this script into your website’s HTML.
              </div>
            </div>

            <div className="relative rounded-md bg-muted p-3 font-mono text-xs">
              <pre className="text-wrap">{embedCode}</pre>

              <Button
                size="sm"
                variant="outline"
                className="absolute right-1 top-1"
                onClick={() => copyToClipboard(embedCode)}
              >
                {copiedText ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </TabsContent>

          {/* WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">WhatsApp number</div>
                <div className="text-sm text-muted-foreground">
                  +1 234 567 890
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Copy
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status</span>
              <Badge variant="secondary">Not connected</Badge>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
