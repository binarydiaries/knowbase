import HeroSection from "./HeroSection.tsx";
import CoreValueSection from "./CoreValueSection.tsx";
import UseCasesSection from "./UseCasesSection.tsx";
import PlatformSection from "./PlatformSection.tsx";

const LandingPage = () => {
    return (
        <div>
            <HeroSection />
            <CoreValueSection />
            <UseCasesSection />
            <PlatformSection />
            {/* Next sections will go here */}
        </div>
    );
};

export default LandingPage;