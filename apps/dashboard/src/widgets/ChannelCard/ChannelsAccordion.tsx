import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@knowbase/ui/components/accordion';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { useParams } from '@tanstack/react-router';
import { Globe, Hash, MessageCircle } from 'lucide-react';
import { useChannels } from '@/store/useChannels.ts';
import ChannelCard from './ChannelCard.tsx';
import SlackChannelCard from './SlackChannelCard.tsx';
import WhatsAppChannelCard from './WhatsAppChannelCard.tsx';

const ChannelsAccordion = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });

  const channelWhatsApp = useChannels((state) =>
    agentId
      ? state.channelsByAgentId[agentId]?.find(
          (c) => c.additional.type === 'whatsapp',
        )
      : undefined,
  );
  const channelSlack = useChannels((state) =>
    agentId
      ? state.channelsByAgentId[agentId]?.find(
          (c) => c.additional.type === 'slack',
        )
      : undefined,
  );

  const isWhatsAppActive =
    channelWhatsApp?.channelStatus === 'active' &&
    channelWhatsApp.additional.type === 'whatsapp' &&
    !!channelWhatsApp.additional.config.displayPhone;

  const isSlackActive =
    channelSlack?.channelStatus === 'active' &&
    channelSlack?.additional.type === 'slack' &&
    !!(channelSlack.additional.config as { slackChannelName?: string })
      .slackChannelName;

  return (
    <Card className="w-full py-0 gap-0">
      <CardHeader className="border-b px-6 py-5">
        <CardTitle className="text-l">Channels</CardTitle>
        <CardDescription>
          Configure how your agent communicates across platforms.
        </CardDescription>
      </CardHeader>
      <Accordion type="multiple" className="w-full" value={['web']}>
        <AccordionItem value="web" className="px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground shrink-0" />
              <span>Web</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ChannelCard readOnly={readOnly} />
          </AccordionContent>
        </AccordionItem>

        {import.meta.env.VITE_WHATSAPP_ENABLED === 'true' && (
          <AccordionItem value="whatsapp" className="px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                <span>WhatsApp</span>
                {isWhatsAppActive && (
                  <span className="size-2 rounded-full bg-green-500 inline-block" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WhatsAppChannelCard readOnly={readOnly} />
            </AccordionContent>
          </AccordionItem>
        )}

        {import.meta.env.VITE_SLACK_ENABLED === 'true' && (
          <AccordionItem value="slack" className="px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-muted-foreground shrink-0" />
                <span>Slack</span>
                {isSlackActive && (
                  <span className="size-2 rounded-full bg-green-500 inline-block" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SlackChannelCard readOnly={readOnly} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </Card>
  );
};

export default ChannelsAccordion;
