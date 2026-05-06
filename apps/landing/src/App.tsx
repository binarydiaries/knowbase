import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Sections/LandingPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import BlogListPage from "./pages/blog/BlogListPage.tsx";
import BlogPostPage from "./pages/blog/BlogPostPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
