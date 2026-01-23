import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
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

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>
      {/*<iframe*/}
      {/*  title="Chatbot"*/}
      {/*  src="http://localhost:5173/"*/}
      {/*  className="fixed bottom-10 right-10 h-full max-h-175 w-100 shadow-[0_0_15px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden "*/}
      {/*/>*/}
    </>,
  );
}
