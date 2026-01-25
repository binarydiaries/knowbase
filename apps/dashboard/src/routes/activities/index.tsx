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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { getChatbots } from '@/services';
import { timeAgo } from '@/services/utilities/datetimeHelper.ts';

type Chatbot = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};
//
// const chatbots: Chatbot[] = [
//   {
//     id: 'sales-bot',
//     name: 'Sales Bot',
//     description: 'Handles sales queries',
//     createdAt: '2024-12-01',
//   },
//   {
//     id: 'support-bot',
//     name: 'Support Bot',
//     description: 'Customer support chatbot',
//     createdAt: '2024-12-10',
//   },
// ];

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
