import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import { FileText, FileUp, MessageSquare } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface IAddDocumentDropdownProps {
  onTextClick: () => void;
  onQaClick: () => void;
  onPdfClick: () => void;
  disabled?: boolean;
}
export const AddDocumentDropdown = ({
  children,
  onQaClick,
  onTextClick,
  onPdfClick,
  disabled = false,
}: PropsWithChildren<IAddDocumentDropdownProps>) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={onTextClick}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Text
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onQaClick}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Q&A
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onPdfClick}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
