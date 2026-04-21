import { BarChart3, Database, Settings, ShieldCheck } from 'lucide-react'
import GetStartedButton from '../components/GetStartedButton'

const platformFeatures = [
    {
        icon: BarChart3,
        title: 'Usage Insights',
        desc: 'Track agent usage, queries, and performance over time. Understand exactly how users interact with your AI.',
    },
    {
        icon: Database,
        title: 'Knowledge Management',
        desc: 'Organize, update, and control your knowledge base from one place. Keep your agents accurate and always up to date.',
    },
    {
        icon: Settings,
        title: 'Custom Agent Settings',
        desc: 'Customize tone, behavior, and response style for each agent. Fine-tune outputs to match your brand or use case.',
    },
    {
        icon: ShieldCheck,
        title: 'Secure & Scalable',
        desc: 'Your data stays private and is handled securely. Built to scale from personal projects to enterprise deployments.',
    },
]

const PlatformSection = () => {
    return (
        <section aria-labelledby="platform-heading" className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/platform-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/45 backdrop-blur-[2px]" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-white/70 backdrop-blur text-[#301B69] mb-6" aria-hidden="true">
                            ✦ PLATFORM
                        </div>

                        <h2 id="platform-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                            Manage and Scale Your AI Agents Effortlessly
                        </h2>

                        <p className="text-[#301B69]/70 max-w-2xl mb-10 text-sm md:text-base">
                            Track usage, manage knowledge, and improve responses—all from a single dashboard.
                        </p>

                        <ul className="relative grid md:grid-cols-2 gap-x-12 gap-y-10 list-none">
                            {platformFeatures.map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <li key={index} className="flex gap-4">
                                        <div className="mt-1 text-[#301B69]" aria-hidden="true">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#301B69] mb-1 text-sm md:text-base">{item.title}</h3>
                                            <p className="text-xs md:text-sm text-[#301B69]/80 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                )
                            })}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-[#301B69]/10" aria-hidden="true" />
                            <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#301B69]/10" aria-hidden="true" />
                        </ul>

                        <div className="mt-12">
                            <GetStartedButton className="bg-[#301B69] text-white px-5 py-2.5 rounded-xl text-sm shadow-md hover:opacity-90 transition">
                                Get Started →
                            </GetStartedButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PlatformSection
