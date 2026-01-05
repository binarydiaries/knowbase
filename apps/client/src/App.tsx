import axios from 'axios';
import { Suspense } from 'react';
import ChatBox from '@/components/ChatBox/ChatBox.tsx';
import { useQueryParams } from '@/hooks/useQueryParams.ts';

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
      <ChatBox messagePromise={messagePromise} />
    </Suspense>
  );
}

export default App;
