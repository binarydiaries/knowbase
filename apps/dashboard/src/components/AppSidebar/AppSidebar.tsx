import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@knowbase/ui/components/sidebar';
import {
  Bot,
  Bubbles,
  Gauge,
  LifeBuoy,
  LineChart,
  MessageCircle,
  Plug,
  UserRound,
} from 'lucide-react';
import { NavMain } from '@/components/NavMain/NavMain.tsx';
import { SidebarUsage } from '@/components/SidebarUsage/SidebarUsage.tsx';
import { NavUser } from '../NavUser/NavUser.tsx';

const mainNav = [
  { name: 'Chatbots', url: '/chatbots', icon: Bot },
  { name: 'Conversations', url: '/conversations', icon: MessageCircle },
  { name: 'Analytics', url: '/analytics', icon: LineChart },
  { name: 'Usage', url: '/usage', icon: Gauge },
  { name: 'Integrations', url: '/integrations', icon: Plug },
];

const actionsNav = [
  { name: 'Leads', url: '/leads', icon: UserRound },
];

const footerNav = [
  { name: 'Help & Support', url: '/', icon: LifeBuoy },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Bubbles />
                <span className="text-base font-semibold">Knowbase.ai</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} title="Platform" />
        <NavMain items={actionsNav} title="Actions" />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={footerNav} />
        <div className="p-2">
          <SidebarUsage />
          <NavUser />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
