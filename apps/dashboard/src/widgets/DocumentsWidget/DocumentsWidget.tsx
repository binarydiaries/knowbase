import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@knowbase/ui/components/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import {
  ArrowUpRightIcon,
  FolderIcon,
  MoreHorizontal,
  ShieldAlertIcon,
} from 'lucide-react';
import { useState } from 'react';
import { getDocuments } from '@/services';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';

export const DocumentsWidget = () => {
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const { chatbotId } = useParams({ strict: false });

  const query = useQuery({
    queryKey: ['documents'],
    queryFn: () => {
      return getDocuments({
        query: { chatbotId: chatbotId },
      });
    },
  });

  const isDocumentsAvailable = !!query?.data?.data?.documents?.length;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            Your chatbot will only answer based on the sources you add here.
          </CardDescription>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Add</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setIsTextContentSheetOpen(true)}
                >
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsQASheetOpen(true)}>
                  Q&A
                </DropdownMenuItem>
                <DropdownMenuItem>PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        {query.data?.data.documents.map((doc) => (
          <CardContent key={doc.id}>
            <Item variant="outline">
              <ItemMedia variant="icon">
                <ShieldAlertIcon />
              </ItemMedia>
              <ItemContent>
                <div className={'flex flex-row gap-4'}>
                  <ItemTitle>{doc.title}</ItemTitle>
                  <Badge>{doc.content.type === 'qna' ? 'Q&A' : 'Text'}</Badge>
                </div>

                <ItemDescription>
                  {doc.content?.type === 'qna'
                    ? `${doc.content.data.length} questions`
                    : String(doc.content?.data)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal />
                </Button>
              </ItemActions>
            </Item>
          </CardContent>
        ))}

        {!isDocumentsAvailable && (
          <Empty className="md:py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderIcon />
              </EmptyMedia>
              <EmptyTitle>No Knowledge Sources Yet</EmptyTitle>
              <EmptyDescription>
                Add documents, links, or text to help your chatbot answer
                questions accurately.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button>Add Source</Button>
            </EmptyContent>
            <Button
              variant="link"
              asChild
              className="text-muted-foreground"
              size="sm"
            >
              <a href="#">
                Learn More <ArrowUpRightIcon />
              </a>
            </Button>
          </Empty>
        )}
      </Card>
      <Sheet
        open={isTextContentSheetOpen}
        onOpenChange={setIsTextContentSheetOpen}
      >
        <TextContentWidget />
      </Sheet>
      <Sheet open={isQASheetOpen} onOpenChange={setIsQASheetOpen}>
        <QAContentWidget />
      </Sheet>
    </>
  );
};
