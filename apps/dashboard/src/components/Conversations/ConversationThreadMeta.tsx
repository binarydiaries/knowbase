import dayjs from 'dayjs';

interface IConversationThreadMetaProps {
  conversation: {
    id: string;
    chatbotId: string;
    channelId: string;
    createdAt: string;
    lastMessageAt: string;
  };
  chatbotName: string;
  channelLabel: string;
}

export function ConversationThreadMeta({
  conversation,
  chatbotName,
  channelLabel,
}: IConversationThreadMetaProps) {
  return (
    <div className="mt-4 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
      <p className="font-medium">Thread metadata (admin)</p>
      <p>Conversation: {conversation.id}</p>
      <p>
        Chatbot: {chatbotName} ({conversation.chatbotId})
      </p>
      <p>
        Channel: {channelLabel} ({conversation.channelId})
      </p>
      <p>
        Created: {dayjs(conversation.createdAt).format('MMM D, YYYY h:mm A')}
      </p>
      <p>
        Last activity:{' '}
        {dayjs(conversation.lastMessageAt).format('MMM D, YYYY h:mm A')}
      </p>
    </div>
  );
}
