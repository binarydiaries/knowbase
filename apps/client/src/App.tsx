import { Spinner } from '@knowbase/ui/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { useQueryParams } from '@/hooks/useQueryParams.ts';
import { getChannel } from '@/services/chat.ts';
import { ChatbotWidget } from '@/widgets/ChatbotWidget/ChatbotWidget.tsx';

function App() {
  const { params } = useQueryParams();
  const channelId = params.get('channelId');
  const orgId = params.get('orgId');

  const query = useQuery({
    queryFn: async () => {
      return getChannel(channelId || '', orgId || '');
    },
    queryKey: ['channel', channelId],
  });

  return (
    <>
      {query.data?.channel && (
        <ChatbotWidget
          channelSchema={query.data?.channel}
          orgId={orgId || ''}
        />
      )}

      {query.isLoading && (
        <div className="h-full flex justify-center items-center">
          <Spinner className="size-6" />
        </div>
      )}
    </>
  );
}

export default App;
