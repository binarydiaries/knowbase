import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { usePostHog } from "@posthog/react";
import LandingPage from "./Sections/LandingPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";

function PostHogIdentify() {
  const { user, isLoaded, isSignedIn } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      posthog?.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
    }
  }, [isLoaded, isSignedIn, user, posthog]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PostHogIdentify />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
