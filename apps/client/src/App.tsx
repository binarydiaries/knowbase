import { ChatbotWidget } from '@/widgets/ChatbotWidget/ChatbotWidget.tsx';

function App() {
  // const { params } = useQueryParams();
  // const conversationId = params.get('id');
  // const getMessages = async () => {
  //   if (conversationId) {
  //     return (
  //       await axios.get('http://localhost:3000/message', {
  //         params: {
  //           conversationId,
  //         },
  //       })
  //     ).data;
  //   }
  //   return [];
  // };
  // const messagePromise = getMessages();
  return (
    <ChatbotWidget />
    // <Suspense fallback={<p>waiting for message...</p>}>
    //   <ChatBoxWidget2 messagePromise={messagePromise} />
    // </Suspense>
  );
}

export default App;
