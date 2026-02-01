import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@knowbase/ui/components/sidebar';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

interface INavItem {
  name: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
}

interface INavMainProps {
  items: INavItem[];
  title?: string;
}

export function NavMain({ items, title }: INavMainProps) {
  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <Link to={item.url}>
              {(state) => (
                <SidebarMenuButton
                  tooltip={item.name}
                  isActive={state.isActive}
                >
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
