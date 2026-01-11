import axios from 'axios';
import { Suspense } from 'react';
import { useQueryParams } from '@/hooks/useQueryParams.ts';
import ChatBoxWidget from '@/widgets/ChatBoxWidget/ChatBoxWidget.tsx';

function App() {
  const { params } = useQueryParams();
  const conversationId = params.get('id');
  const getMessages = async () => {
    if (conversationId) {
      return (
        await axios.get('http://localhost:3000/message', {
          params: {
            conversationId,
          },
        })
      ).data;
    }
    return [];
  };
  const messagePromise = getMessages();
  return (
    <Suspense fallback={<p>waiting for message...</p>}>
      <ChatBoxWidget messagePromise={messagePromise} />
    </Suspense>
  );
}

export default App;
