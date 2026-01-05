import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/chatbots/$chatbotId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/chatbots/$chatbotId"!</div>;
}
