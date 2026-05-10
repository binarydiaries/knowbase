import GetStartedButton from '../components/GetStartedButton';
import amplitude from '../lib/amplitude';

const HeroSection = () => {
  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/hero-bg.png')" }}
    >
      <div
        className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <header className="relative z-20 max-w-6xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl">
          <a href="/" aria-label="Agenvik home">
            <img src="/TextLogo.svg" alt="Agenvik" className="h-7 w-auto" />
          </a>

          <nav
            aria-label="Main navigation"
            className="hidden md:flex gap-8 text-sm text-[#301B69]"
          >
            <a
              href="#features"
              className="hover:opacity-80"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:opacity-80"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="hover:opacity-80"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hover:opacity-80"
            >
              FAQ
            </a>
            <a
              href="/blog"
              className="hover:opacity-80"
            >
              Blog
            </a>
          </nav>

          <GetStartedButton source="hero_nav" className="bg-[#301B69] text-white px-4 py-2 rounded-lg text-sm">
            Get Started
          </GetStartedButton>
        </div>
      </header>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-16 pb-28">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
          <span className="bg-gradient-to-b from-[#301B69] to-[#B07CD1] bg-clip-text text-transparent">
            The Fastest Way to
          </span>
          <br />
          <span className="text-[#301B69]">Build Your AI Agent</span>
        </h1>

        <p className="text-[#301B69] mb-8">
          Turn your documents, notes, and data into powerful AI
          agents—instantly.
          <br /> No coding required. Deploy anywhere.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <GetStartedButton source="hero_body" className="px-6 py-3 bg-[#301B69] text-white rounded-xl">
            Get Started →
          </GetStartedButton>
          <a
            href="mailto:hello@agenvik.com"
            className="px-6 py-3 text-[#301B69] bg-white rounded-xl"
            onClick={() => amplitude.track('Contact Us Clicked', { source: 'hero' })}
          >
            Contact Us
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 -mt-16 pb-10">
        <img
          src="/hero-dashboard.png"
          alt="Agenvik platform dashboard showing AI agent creation and management interface"
          className="rounded-2xl shadow-2xl w-full opacity-90"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent rounded-2xl"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default HeroSection;
