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
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { getChatbots } from '@/services';

export const Route = createFileRoute('/activities/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => {
      return getChatbots();
    },
  });

  return (
    <Card className={'m-6'}>
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
            {query?.data?.data.chatbots.map((bot) => (
              <TableRow
                key={bot.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  navigate({
                    to: '/activities/$chatbotId',
                    params: { chatbotId: bot.id },
                  })
                }
              >
                <TableCell className="font-medium">{bot.name}</TableCell>
                <TableCell>{bot.description}</TableCell>
                {/*<TableCell>{bot.createdAt}</TableCell>*/}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
