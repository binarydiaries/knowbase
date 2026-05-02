import { useUser } from '@clerk/clerk-react';
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
  CreditCard,
  Gauge,
  LifeBuoy,
  LineChart,
  ListOrdered,
  MessageCircle,
  Plug,
  Shield,
  // UserRound, // LEAD_GENERATION_DISABLED: uncomment to restore
} from 'lucide-react';
import { NavMain } from '@/components/NavMain/NavMain.tsx';
import { SidebarUsage } from '@/components/SidebarUsage/SidebarUsage.tsx';
import { isAdminEmail } from '@/utils/adminAccess';
import { NavUser } from '../NavUser/NavUser.tsx';

const mainNav = [
  { name: 'Agents', url: '/agents', icon: Bot },
  { name: 'Analytics', url: '/analytics', icon: LineChart },
  { name: 'Usage', url: '/usage', icon: Gauge },
  { name: 'Integrations', url: '/integrations', icon: Plug },
];

const inboxNav = [
  { name: 'Conversations', url: '/conversations', icon: MessageCircle },
  // { name: 'Leads', url: '/leads', icon: UserRound }, // LEAD_GENERATION_DISABLED: uncomment to restore
];

const footerNav = [
  {
    name: 'Help & Support',
    url: 'https://docs.agenvik.com/help-and-support/overview',
    icon: LifeBuoy,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const adminNav = isAdminEmail(user?.primaryEmailAddress?.emailAddress)
    ? [
        { name: 'Admin Costs', url: '/admin/costs', icon: Shield },
        { name: 'Admin Queue', url: '/admin/queue', icon: ListOrdered },
        { name: 'Admin Subscriptions', url: '/admin/subscriptions', icon: CreditCard },
      ]
    : [];

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
                <img
                  src="/TextLogoLight.svg"
                  alt="Agenvik"
                  className="size-25 mt-2 block dark:hidden"
                />

                <img
                  src="/TextLogoDark.svg"
                  alt="Agenvik"
                  className="size-25 mt-2 hidden dark:block"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} title="Platform" />
        <NavMain items={inboxNav} title="Inbox" />
        {adminNav.length > 0 && <NavMain items={adminNav} title="Admin" />}
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
