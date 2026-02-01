import { Button } from '@knowbase/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@knowbase/ui/components/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@knowbase/ui/components/sidebar';
import { FileText, MoreHorizontal, Settings2 } from 'lucide-react';

export const ChatbotMenuActions = () => {
  const data = [
    [
      {
        label: 'Customize Page',
        icon: Settings2,
      },
      {
        label: 'Turn into wiki',
        icon: FileText,
      },
    ],
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-accent h-7 w-7"
        >
          <MoreHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 overflow-hidden rounded-lg p-0"
        align="end"
      >
        <Sidebar collapsible="none" className="bg-transparent">
          <SidebarContent>
            {data.map((group, index) => (
              <SidebarGroup key={index} className="border-b last:border-none">
                <SidebarGroupContent className="gap-0">
                  <SidebarMenu>
                    {group.map((item, index) => (
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton>
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
      </PopoverContent>
    </Popover>
  );
};
