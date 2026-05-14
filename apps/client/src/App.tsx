import { Spinner } from '@knowbase/ui/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { useQueryParams } from '@/hooks/useQueryParams.ts';
import { getChannel } from '@/services/chat.ts';
import { AgentWidget } from '@/widgets/AgentWidget/AgentWidget.tsx';

function App() {
  const { params } = useQueryParams();
  const channelId = params.get('channelId');
  const parentOrigin = params.get('parentOrigin') ?? undefined;

  const query = useQuery({
    queryFn: async () => {
      return getChannel(channelId || '', parentOrigin);
    },
    queryKey: ['channel', channelId],
  });

  return (
    <>
      {query.data?.channel && (
        <AgentWidget
          channelSchema={query.data?.channel}
          parentOrigin={parentOrigin}
        />
      )}

      {query.isLoading && (
        <div className="h-full flex justify-center items-center">
          <Spinner className="size-6" />
        </div>
      )}

      {query.isError && (
        <div className="h-full flex justify-center items-center p-6">
          <p className="text-sm text-center text-muted-foreground">
            Failed to load. Please try again later.
          </p>
        </div>
      )}
    </>
  );
}

export default App;
