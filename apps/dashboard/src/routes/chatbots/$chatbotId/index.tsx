import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@knowbase/ui/components/breadcrumb';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Chatbot } from '@knowbase/ui/widgets/Chatbot/Chatbot';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MoreHorizontal, ShieldAlertIcon } from 'lucide-react';

export const Route = createFileRoute('/chatbots/$chatbotId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <Link to={'/chatbots'}>
                  <BreadcrumbLink>Chatbots</BreadcrumbLink>
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Customer Support</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <Separator />
      <div className="flex flex-1">
        <div className="w-1/2 p-5 shadow-none">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Knowledge Sources</CardTitle>
              <CardDescription>
                You stored knowledge used for chatbot
              </CardDescription>
              <CardAction>
                <Button variant="outline">Add</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Item variant="outline">
                <ItemMedia variant="icon">
                  <ShieldAlertIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Security Alert</ItemTitle>
                  <ItemDescription>
                    New login detected from unknown device.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal />
                  </Button>
                </ItemActions>
              </Item>
            </CardContent>
          </Card>
        </div>
        <div className="w-1/2 p-5">
          <Chatbot />
        </div>
      </div>
    </>
  );
}
