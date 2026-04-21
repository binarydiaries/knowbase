import { FileText, Zap, Boxes, Link as LinkIcon } from 'lucide-react'
import GetStartedButton from '../components/GetStartedButton'

const features = [
    {
        icon: FileText,
        title: 'Knowledge Sources',
        desc: "Import data from text, FAQs, and documents. Continuously expand your agent's knowledge as your needs grow.",
    },
    {
        icon: Zap,
        title: 'Instant Agent Creation',
        desc: 'Spin up AI agents in seconds with zero setup. No coding, no config—just define your agent and go live.',
    },
    {
        icon: Boxes,
        title: 'Real-time Responses',
        desc: 'Deliver fast, accurate answers instantly. Optimized for low latency and high relevance.',
    },
    {
        icon: LinkIcon,
        title: 'Smart Retrieval',
        desc: 'AI intelligently fetches answers from your data, providing context-aware responses that are always on point.',
    },
]

const CoreValueSection = () => {
    return (
        <section id="features" aria-labelledby="features-heading" className="px-6 pt-6">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-14 bg-cover bg-center overflow-hidden"
                    style={{ backgroundImage: "url('/core-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" aria-hidden="true" />
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#301B69]/20 blur-[120px] opacity-30" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-sm rounded-full bg-white/70 backdrop-blur text-[#301B69] mb-6" aria-hidden="true">
                            ✦ CORE VALUE
                        </div>

                        <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
                            AI Agents Built on Your Knowledge
                        </h2>

                        <p className="text-[#301B69] max-w-2xl mb-10 leading-relaxed">
                            Agenvik lets you build intelligent agents trained on your own data—so every response is accurate, contextual, and genuinely useful.
                        </p>

                        <ul className="relative grid md:grid-cols-2 gap-x-12 gap-y-10 list-none">
                            {features.map((item, index) => {
                                const Icon = item.icon
                                return (
                                    <li key={index} className="flex gap-4">
                                        <div className="mt-1 text-[#301B69]" aria-hidden="true">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#301B69] mb-1">{item.title}</h3>
                                            <p className="text-sm text-[#301B69]/80 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                )
                            })}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-[#301B69]/10" aria-hidden="true" />
                            <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#301B69]/10" aria-hidden="true" />
                        </ul>

                        <div className="mt-12">
                            <GetStartedButton className="bg-[#301B69] text-white px-6 py-3 rounded-xl shadow-md hover:opacity-90 transition">
                                Create Your First Agent →
                            </GetStartedButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CoreValueSection
