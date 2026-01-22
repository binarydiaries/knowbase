import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@knowbase/ui/components/table';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

type Chatbot = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

const chatbots: Chatbot[] = [
  {
    id: 'sales-bot',
    name: 'Sales Bot',
    description: 'Handles sales queries',
    createdAt: '2024-12-01',
  },
  {
    id: 'support-bot',
    name: 'Support Bot',
    description: 'Customer support chatbot',
    createdAt: '2024-12-10',
  },
];

export const Route = createFileRoute('/activity/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chatbots</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {chatbots.map((bot) => (
              <TableRow
                key={bot.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  navigate({
                    to: '/chatbot/$chatbotId',
                    params: { chatbotId: bot.id },
                  })
                }
              >
                <TableCell className="font-medium">{bot.name}</TableCell>
                <TableCell>{bot.description}</TableCell>
                <TableCell>{bot.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
