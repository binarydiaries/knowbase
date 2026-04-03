import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
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
        <DropdownMenuItem onClick={onTextClick} disabled={disabled}>
          Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onQaClick} disabled={disabled}>
          Q&A
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
