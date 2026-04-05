import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Input } from '@knowbase/ui/components/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@knowbase/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { FilterIcon } from 'lucide-react';

interface IConversationFiltersPopoverProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  chatbotIdFilter: string;
  onChatbotIdFilterChange: (value: string) => void;
  chatbotOptions: Array<{ id: string; name: string }>;
}

export function ConversationFiltersPopover({
  searchTerm,
  onSearchTermChange,
  chatbotIdFilter,
  onChatbotIdFilterChange,
  chatbotOptions,
}: IConversationFiltersPopoverProps) {
  const activeFilterCount = chatbotIdFilter !== 'all' ? 1 : 0;

  return (
    <div className="flex items-center gap-2">
      <Input
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Search thread, reply, or ID"
        className="w-full"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <FilterIcon className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Chatbot</p>
            <Select
              value={chatbotIdFilter}
              onValueChange={onChatbotIdFilterChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All chatbots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chatbots</SelectItem>
                {chatbotOptions.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onChatbotIdFilterChange('all');
            }}
            disabled={activeFilterCount === 0}
          >
            Clear filters
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
