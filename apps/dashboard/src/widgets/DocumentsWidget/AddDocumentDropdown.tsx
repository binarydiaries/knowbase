import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import { FileText, FileUp, Globe, MessageSquare } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface IAddDocumentDropdownProps {
  onTextClick: () => void;
  onQaClick: () => void;
  onPdfClick: () => void;
  onUrlClick: () => void;
  disabled?: boolean;
  showUrlOption?: boolean;
}
export const AddDocumentDropdown = ({
  children,
  onQaClick,
  onTextClick,
  onPdfClick,
  onUrlClick,
  disabled = false,
  showUrlOption = true,
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
        {showUrlOption && (
          <DropdownMenuItem
            onClick={onUrlClick}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Website URL
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
