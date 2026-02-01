import { useQuery } from '@tanstack/react-query';
import { useQueryParams } from '@/hooks/useQueryParams.ts';
import { getChannel } from '@/services/chat.ts';
import { ChatbotWidget } from '@/widgets/ChatbotWidget/ChatbotWidget.tsx';

function App() {
  const { params } = useQueryParams();
  const channelId = params.get('channelId');

  const query = useQuery({
    queryFn: () => getChannel(channelId || ''),
    queryKey: ['channel', channelId],
  });

  return (
    <>
      {query.data?.channel && (
        <ChatbotWidget channelSchema={query.data?.channel} />
      )}
    </>
  );
}

export default App;
