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
}
export const AddDocumentDropdown = ({
  children,
  onQaClick,
  onTextClick,
}: PropsWithChildren<IAddDocumentDropdownProps>) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onTextClick}>Text</DropdownMenuItem>
        <DropdownMenuItem onClick={onQaClick}>Q&A</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
