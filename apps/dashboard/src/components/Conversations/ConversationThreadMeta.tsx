import dayjs from 'dayjs';

interface IConversationThreadMetaProps {
  conversation: {
    id: string;
    createdAt: string;
    lastMessageAt: string;
  };
  agentName: string;
  channelLabel: string;
}

export function ConversationThreadMeta({
  conversation,
  agentName,
  channelLabel,
}: IConversationThreadMetaProps) {
  return (
    <div className="mt-4 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
      <p className="font-medium">Thread metadata (admin)</p>
      <p>Conversation: {conversation.id}</p>
      <p>Agent: {agentName}</p>
      <p>Channel: {channelLabel}</p>
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
