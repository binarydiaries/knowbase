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
import { NavProjects } from '../NavProjects/NavProjects.tsx';
import { NavUser } from '../NavUser/NavUser.tsx';
import { TeamSwitcher } from '../TeamSwitcher/TeamSwitcher.tsx';

// This is sample data.
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
      url: '/activity',
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
        <NavProjects projects={data.main} />
        <NavProjects projects={data.chatbots} title={'Favourites'} />
      </SidebarContent>
      <SidebarFooter>
        <NavProjects projects={data.footer} />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
