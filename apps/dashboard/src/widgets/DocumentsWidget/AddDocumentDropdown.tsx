import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import { FileText, MessageSquare } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface IAddDocumentDropdownProps {
  onTextClick: () => void;
  onQaClick: () => void;
  disabled?: boolean;
}
export const AddDocumentDropdown = ({
  children,
  onQaClick,
  onTextClick,
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
