import './index.css';
import * as amplitude from '@amplitude/unified';
import {
  ClerkLoading,
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Toaster } from '@knowbase/ui/components/sonner';
import { TooltipProvider } from '@knowbase/ui/components/tooltip';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { ThemeProvider, useTheme } from 'next-themes';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { client } from '@/services/client.gen.ts';
// Import the generated route tree
import { routeTree } from './routeTree.gen';
import {KelviqProvider} from "@kelviq/react-sdk";

const router = createRouter({ routeTree });

amplitude.initAll(import.meta.env.VITE_AMPLITUDE_API_KEY, {
  analytics: {
    remoteConfig: { fetchRemoteConfig: true }, // fetch remote SDK config from Amplitude
    autocapture: {
      attribution: true,           // UTM / referrer attribution events
      pageViews: true,             // SPA route changes + initial load
      sessions: true,              // Session start / end events
      formInteractions: true,      // Form starts + submits
      fileDownloads: true,         // Downloads of common file types
      elementInteractions: true,   // Click + change on instrumented elements
      frustrationInteractions: true, // Rage clicks, dead clicks
      pageUrlEnrichment: true,     // Adds path / search to event properties
      networkTracking: true,       // XHR + fetch request events
      webVitals: true,             // Core Web Vitals (LCP, INP, CLS)
    },
  },
  sessionReplay: { sampleRate: 1 }, // Record user sessions; comment out to disable
  engagement: {},                   // In-product Guides & Surveys; comment out to disable
});

Sentry.init({
  dsn: 'https://e7f1b31d7d33df35a37aa773be554f8d@o4505526005399552.ingest.us.sentry.io/4511332509941760',
  environment: import.meta.env.VITE_ENV_KEY ?? 'development',
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  enableLogs: true,
  tracesSampleRate: 0.2,
  tracePropagationTargets: [import.meta.env.VITE_API_BASE].filter(Boolean),
});

// Create a new router instance

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
const queryClient = new QueryClient();

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

client.setConfig({
  baseURL: import.meta.env.VITE_API_BASE,
});

client.instance.interceptors.request.use(async (config) => {
  const token = await (
    window as Window & {
      Clerk?: { session?: { getToken: () => Promise<string | null> } };
    }
  ).Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function AppWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{ baseTheme: resolvedTheme === 'dark' ? dark : undefined }}
    >
      <ClerkLoading>
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClerkLoading>
      <SignedIn>
        <KelviqProvider
            customerId="keshav"
            accessToken="client-3da1e810-14f1-414d-a9be-39d1f520d35a:ab69a984-3d68-40e2-9fe6-6c02cc8544b3"
            productId="agenvik-app"
            // plansEnabled="pro,enterprise" // optional: filter to specific plans
            config={{
              fetchPricingOnMount: true, // fetch pricing data on mount
            }}
            environment="sandbox"
        >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </QueryClientProvider>
        </KelviqProvider>
        <Toaster />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}

// Render the app
// biome-ignore lint/style/noNonNullAssertion: Its from vite
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppWithTheme />
      </ThemeProvider>
    </StrictMode>,
  );
}
