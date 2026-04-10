import { Navbar } from '@/sections/Navbar';
import { Hero } from '@/sections/Hero';
import { PlatformPreview } from '@/sections/PlatformPreview';
import { CoreValueSection } from '@/sections/CoreValueSection';
import { ManagementSection } from '@/sections/ManagementSection';
import { PlanningSection } from '@/sections/PlanningSection';
import { HowItWorksSection } from '@/sections/HowItWorksSection';
import { CTASection } from '@/sections/CTASection';
import { PricingSection } from '@/sections/PricingSection';
import { FaqSection } from '@/sections/FaqSection';
import { Footer } from '@/sections/Footer';

function App() {
  return (
    <div className="page-bg">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <Navbar />
      <main>
        <Hero />
        <PlatformPreview />
        <CoreValueSection />
        <ManagementSection />
        <PlanningSection />
        <HowItWorksSection />
        <CTASection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
