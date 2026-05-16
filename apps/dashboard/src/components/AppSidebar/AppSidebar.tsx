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
import { Link } from '@tanstack/react-router';
import {
  Bot,
  CalendarCheck,
  CreditCard,
  Flag,
  Gauge,
  LifeBuoy,
  LineChart,
  ListOrdered,
  MessageCircle,
  Plug,
  Shield,
  // UserRound, // LEAD_GENERATION_DISABLED: uncomment to restore
} from 'lucide-react';
import { NavAdmin } from '@/components/NavAdmin/NavAdmin.tsx';
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
    url: 'https://agenvik.com/docs/help-and-support/overview',
    icon: LifeBuoy,
  },
];

const adminGroups = [
  {
    label: 'Finance',
    items: [
      { name: 'Costs', url: '/admin/costs', icon: Shield },
      { name: 'Subscriptions', url: '/admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Queue', url: '/admin/queue', icon: ListOrdered },
      { name: 'Feature Flags', url: '/admin/feature-flags', icon: Flag },
    ],
  },
  {
    label: 'CRM',
    items: [
      { name: 'Demo Bookings', url: '/admin/demo-bookings', icon: CalendarCheck },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
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
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} title="Platform" />
        <NavMain items={inboxNav} title="Inbox" />
        {isAdmin && <NavAdmin groups={adminGroups} />}
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
