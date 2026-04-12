import {
    // Facebook,
    // Twitter,
    // Linkedin,
    // Youtube,
    // Instagram,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram } from "react-icons/fa";

const Footer = () => {
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // adjust if navbar height changes
            const top = el.offsetTop - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };
    return (
        <footer className="px-6 ">
            <div className="w-full mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden  bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/footer-bg.png')", // 👈 your bg
                    }}
                >

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Top Grid */}
                        <div className="grid md:grid-cols-5 gap-10">

                            {/* Logo */}
                            <div className="col-span-1">
                                <div className="flex items-center gap-2 text-[#301B69] font-semibold text-lg">
                                    <div className="w-6 h-6 rounded-full bg-[#301B69]" />
                                    Knowbase
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#301B69] mb-4">
                                    Quick Links
                                </h4>
                                <ul className="space-y-2 text-sm text-[#301B69]/70">
                                    <li className="cursor-pointer hover:text-[#301B69]" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                        Home
                                    </li>

                                    <li className="cursor-pointer hover:text-[#301B69]" onClick={() => scrollToSection("features")}>
                                        Features
                                    </li>

                                    <li className="cursor-pointer hover:text-[#301B69]" onClick={() => scrollToSection("how-it-works")}>
                                        How it Works
                                    </li>

                                    <li className="cursor-pointer hover:text-[#301B69]" onClick={() => scrollToSection("pricing")}>
                                        Pricing
                                    </li>

                                    <li className="cursor-pointer hover:text-[#301B69]" onClick={() => scrollToSection("faq")}>
                                        FAQ
                                    </li>
                                </ul>
                            </div>

                            {/* Support */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#301B69] mb-4">
                                    Support
                                </h4>
                                <ul className="space-y-2 text-sm text-[#301B69]/70">
                                    <li onClick={() => scrollToSection("faq")} className="cursor-pointer hover:text-[#301B69]">
                                        Help Center
                                    </li>
                                    <li>Getting Started</li>
                                    <li>Contact Support</li>
                                    <li>Community Forums</li>
                                    <li>Documentation</li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#301B69] mb-4">
                                    Contact Us
                                </h4>

                                <div className="space-y-3 text-sm text-[#301B69]/70">
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} />
                                        contact@company.com
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Mail size={14} />
                                        (414) 687 - 5892
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="mt-1" />
                                        <span>
                      794 Mcallister St <br />
                      San Francisco, 94102
                    </span>
                                    </div>
                                </div>
                            </div>

                            {/* Social */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#301B69] mb-4">
                                    Social
                                </h4>

                                <div className="flex gap-3">
                                    {[FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram ].map(
                                        (Icon, i) => (
                                            <div
                                                key={i}
                                                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#301B69] text-white shadow-md cursor-pointer hover:opacity-90"
                                            >
                                                <Icon size={16} />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mt-12 border-t border-[#301B69]/10" />

                        {/* Bottom */}
                        <div className="text-center text-sm text-[#301B69]/70 mt-6">
                            © 2026 Knowbase. All rights reserved.
                        </div>

                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;