import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@knowbase/ui/components/sidebar';
import {
  Activity,
  AudioWaveform,
  Bot,
  Command,
  Dot,
  GalleryVerticalEnd,
  Gauge,
  LifeBuoy,
  LineChart,
  Settings,
} from 'lucide-react';
import { NavMain } from '@/components/NavMain/NavMain.tsx';
import { NavUser } from '../NavUser/NavUser.tsx';
import { TeamSwitcher } from '../TeamSwitcher/TeamSwitcher.tsx';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  main: [
    {
      name: 'Chatbots',
      url: '/chatbots',
      icon: Bot,
    },
    {
      name: 'Activities',
      url: '/activities',
      icon: Activity,
    },
    {
      name: 'Analytics',
      url: '/analytics',
      icon: LineChart,
    },
    {
      name: 'Usage',
      url: '/usage',
      icon: Gauge,
    },
  ],
  chatbots: [
    {
      name: 'Customer support',
      url: '/',
      icon: Dot,
    },
    {
      name: 'Sales Representative',
      url: '/',
      icon: Dot,
    },
  ],
  footer: [
    {
      name: 'Help & Support',
      url: '/',
      icon: LifeBuoy,
    },
    {
      name: 'Settings',
      url: '/',
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.main} title="Platform" />
        {/*<NavProjects projects={data.chatbots} title={'Favourites'} />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.footer} />
        <div className="p-2">
          <NavUser />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
