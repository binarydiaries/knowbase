import HeroSection from "./HeroSection.tsx";
import CoreValueSection from "./CoreValueSection.tsx";
import UseCasesSection from "./UseCasesSection.tsx";
import PlatformSection from "./PlatformSection.tsx";
import HowItWorksSection from "./HowItWorksSection.tsx";
import PricingSection from "./PricingSection.tsx";
import Footer from "./Footer.tsx";
import FAQSection from "./FAQSection.tsx";

const LandingPage = () => {
    return (
        <div>
            <HeroSection />
            <main>
                <CoreValueSection />
                <UseCasesSection />
                <PlatformSection />
                <HowItWorksSection />
                <PricingSection />
                <FAQSection />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
