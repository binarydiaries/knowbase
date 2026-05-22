import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@knowbase/ui/components/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@knowbase/ui/components/sidebar';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface AdminNavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

interface NavAdminProps {
  groups: AdminNavGroup[];
}

export function NavAdmin({ groups }: NavAdminProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggle(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        {groups.map((group) => {
          const isOpen = openGroups[group.label] ?? false;
          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggle(group.label)}
              asChild
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={group.label}>
                    <ShieldCheck className="opacity-60" />
                    <span>{group.label}</span>
                    <ChevronRight
                      className="ml-auto transition-transform duration-200 data-[state=open]:rotate-90"
                      data-state={isOpen ? 'open' : 'closed'}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.name}>
                        <Link to={item.url}>
                          {(state) => (
                            <SidebarMenuSubButton isActive={state.isActive}>
                              <item.icon />
                              <span>{item.name}</span>
                            </SidebarMenuSubButton>
                          )}
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
