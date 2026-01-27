import { Badge } from '@knowbase/ui/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@knowbase/ui/components/breadcrumb';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChatbotPreview } from '@/widgets/ChatbotPreview/ChatbotPreview.tsx';
import { DocumentsWidget } from '@/widgets/DocumentsWidget/DocumentsWidget.tsx';
import SettingsCard from '@/widgets/SettingsCard/SettingsCard.tsx';

export const Route = createFileRoute('/chatbots/$chatbotId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-screen flex flex-col">
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
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="grow p-5 shadow-none flex-col flex gap-5 h-full overflow-auto border-r">
          <DocumentsWidget />
          <SettingsCard />
        </div>
        <div className="w-130 shrink-0 flex flex-col gap-5">
          <Badge variant="secondary" className="rounded-l-none">
            Web Preview
          </Badge>
          <div className="h-full flex justify-center pb-5">
            <ChatbotPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
