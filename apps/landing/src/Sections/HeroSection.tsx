


const HeroSection = () => {
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 10; // navbar height
            const top = el.offsetTop - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };
    return (
        <section
            className="relative w-full overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: "url('/hero-bg.png')",
            }}
        >
            {/* Overlay (important for softness like your design) */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

            {/* Navbar */}
            <div className="relative z-20 max-w-6xl mx-auto px-6 pt-6">
                <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl">

                    <div className="font-semibold text-[#301B69]">
                        Knowbase
                    </div>

                    <div className="hidden md:flex gap-8 text-sm text-[#301B69]">
                        {/*<a href="#features" className="hover:opacity-80">Features</a>*/}
                        {/*<a href="#how-it-works" className="hover:opacity-80">How it Works</a>*/}
                        {/*<a href="#pricing" className="hover:opacity-80">Pricing</a>*/}
                        {/*<a href="#faq" className="hover:opacity-80">FAQ</a>*/}

                        <button onClick={() => scrollToSection("features")}>
                            Features
                        </button>

                        <button onClick={() => scrollToSection("how-it-works")}>
                            How it Works
                        </button>

                        <button onClick={() => scrollToSection("pricing")}>
                            Pricing
                        </button>

                        <button onClick={() => scrollToSection("faq")}>
                            FAQ
                        </button>
                    </div>

                    <button className="bg-[#301B69] text-white px-4 py-2 rounded-lg text-sm">
                        Get Started
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-16 pb-28">


                <div className="relative">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">


                        {/* Gradient part */}
                        <span className="bg-gradient-to-b from-[#301B69] to-[#B07CD1] bg-clip-text text-transparent">
                            The Fastest Way to
                        </span>

                        <br />

                        {/* Normal text */}
                        <span className="text-[#301B69]">
                            Build Your AI Chatbot
                        </span>

                    </h1>
                </div>

                <p className="text-[#301B69] mb-8">
                    Turn your documents, notes, and data into powerful AI chatbots—instantly.<br/> No coding required. Deploy anywhere.
                </p>

                <div className="flex justify-center gap-4 flex-wrap">
                    <button className="px-6 py-3 bg-[#301B69] text-white rounded-xl">
                        Get Started →
                    </button>

                    <button className="px-6 py-3 text-[#301B69] bg-white  rounded-xl">
                        Contact Us
                    </button>
                </div>
            </div>

            {/* Dashboard Image */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 -mt-16 pb-10">
                <img
                    src="/hero-dashboard.png"
                    alt="dashboard"
                    className="rounded-2xl shadow-2xl w-full opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent rounded-2xl" />
            </div>

        </section>
    );
};

export default HeroSection;