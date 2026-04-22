import './index.css';
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Toaster } from '@knowbase/ui/components/sonner';
import { TooltipProvider } from '@knowbase/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { ThemeProvider, useTheme } from 'next-themes';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { client } from '@/services/client.gen.ts';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

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
  const token = await (window as Window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk?.session?.getToken();
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppWithTheme />
      </ThemeProvider>
    </StrictMode>,
  );
}
