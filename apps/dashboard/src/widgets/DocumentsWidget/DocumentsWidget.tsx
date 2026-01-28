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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Edit, MoreHorizontal, ShieldAlertIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteDocumentsById, getDocuments } from '@/services';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';
export const DocumentsWidget = () => {
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const { chatbotId } = useParams({ strict: false });
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);

  const query = useQuery({
    queryKey: ['documents'],
    queryFn: () => {
      return getDocuments({
        query: { chatbotId: chatbotId },
      });
    },
  });
  const queryClient = useQueryClient();

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteDocumentsById({
        path: {
          id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            You stored knowledge used for chatbot
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
                <DropdownMenuItem
                  onClick={() => {
                    setIsEdit(false);
                    setIsQASheetOpen(true);
                  }}
                >
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
                {/*<Button size="icon" variant="ghost">*/}
                {/*  <MoreHorizontal />*/}
                {/*</Button>*/}
                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground  cursor-pointer "
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40 ">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDocument(doc);
                        setIsEdit(true);

                        if (doc.content.type === 'text') {
                          setIsTextContentSheetOpen(true);
                        } else if (doc.content.type === 'qna') {
                          setIsQASheetOpen(true);
                        }
                      }}
                      className="flex items-center cursor-pointer gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocumentMutation.mutate(doc.id);
                      }}
                      className="flex items-center gap-2  cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 text-red" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ItemActions>
            </Item>
          </CardContent>
        ))}
      </Card>
      <Sheet
        open={isTextContentSheetOpen}
        onOpenChange={setIsTextContentSheetOpen}
      >
        <TextContentWidget
          mode={isEdit ? 'edit' : 'add'}
          document={selectedDocument}
          onClose={() => {
            setIsTextContentSheetOpen(false);
            setSelectedDocument(null);
          }}
        />
      </Sheet>
      <Sheet open={isQASheetOpen} onOpenChange={setIsQASheetOpen}>
        <QAContentWidget
          mode={isEdit ? 'edit' : 'add'}
          document={selectedDocument}
          onClose={() => {
            setIsQASheetOpen(false);
            setSelectedDocument(null);
          }}
        />
      </Sheet>
    </>
  );
};
