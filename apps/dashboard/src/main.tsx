import './index.css';
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

const router = createRouter({ routeTree });

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'development',
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  enableLogs: true,
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
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
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </QueryClientProvider>
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
      <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>} showDialog>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppWithTheme />
        </ThemeProvider>
      </Sentry.ErrorBoundary>
    </StrictMode>,
  );
}
