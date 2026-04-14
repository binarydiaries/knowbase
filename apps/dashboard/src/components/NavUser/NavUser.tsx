import { SignOutButton, UserAvatar, useUser } from '@clerk/clerk-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@knowbase/ui/components/sidebar';
import { Link } from '@tanstack/react-router';
import {
  BadgeCheck,
  Building,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useClerkPlan } from '@/hooks/useClerkPlan';

export function NavUser() {
  const posthog = usePostHog();
  const { isMobile } = useSidebar();
  const { user } = useUser();
  const { isPaid, planLabel } = useClerkPlan();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
              <span className="ml-auto text-xs font-medium text-primary shrink-0">
                {planLabel}
              </span>
              <ChevronsUpDown className="size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                  <span className="text-xs font-medium text-primary">{planLabel}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  to={'/subscriptions'}
                  onClick={() =>
                    posthog.capture('upgrade_plan_clicked', {
                      is_paid: isPaid,
                      plan_label: planLabel,
                    })
                  }
                >
                  {isPaid ? <CreditCard /> : <Sparkles />}
                  {isPaid ? 'Manage Billing' : 'Upgrade Plan'}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={'/account'}>
                  <BadgeCheck />
                  User Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={'/organization'}>
                  <Building />
                  Organization
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem
                onClick={() => {
                  posthog.capture('user_signed_out');
                  posthog.reset();
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
