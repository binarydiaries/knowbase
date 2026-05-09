import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Redirect } from './components/Redirect.tsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.tsx';
import TermsPage from './pages/TermsPage.tsx';
import LandingPage from './Sections/LandingPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/dashboard"
          element={<Redirect url={import.meta.env.VITE_APP_URL} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
