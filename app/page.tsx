"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Anchor,
  Compass,
  LifeBuoy,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Zap,
  Star,
  ArrowRight,
  Map,
  Navigation,
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    // Simply redirect to the sign-in page where users can choose their authentication method
    router.push("/auth/signin");
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1f3a] via-[#0e2a55] to-[#0b1f3a]">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-[#1e3a8a] rounded-lg flex items-center justify-center ring-1 ring-blue-300/40">
              <Anchor className="w-5 h-5 text-blue-100" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">CaptainAI</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="#benefits"
              className="text-blue-100/80 hover:text-white font-medium transition-colors"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              className="text-blue-100/80 hover:text-white font-medium transition-colors"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-blue-100/80 hover:text-white font-medium transition-colors"
            >
              Features
            </a>
            <Link
              href="#pricing"
              className="text-blue-100/80 hover:text-white font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/auth/signin"
              className="bg-teal-400/90 hover:bg-teal-300 text-[#0b1f3a] px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-300 focus-visible:ring-offset-[#0b1f3a]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with nautical waves */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 560">
            <defs>
              <pattern id="chart" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M0 80 H160 M80 0 V160" stroke="#93c5fd" strokeWidth="0.5" />
                <circle cx="80" cy="80" r="2" fill="#93c5fd" />
              </pattern>
            </defs>
            <rect width="1440" height="560" fill="url(#chart)" />
          </svg>
        </div>
        <div className="container mx-auto px-6 pt-16 pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 rounded-full bg-blue-900/50 ring-1 ring-blue-300/20 px-3 py-1 mb-4">
              <LifeBuoy className="w-4 h-4 text-teal-300" />
              <span className="text-xs tracking-wide text-blue-100">Built for fishing charter captains</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Never miss a booking
              <span className="text-teal-300 block">even when you&apos;re offshore</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/90 mb-8 max-w-2xl mx-auto">
              An AI phone assistant that answers calls, captures leads, and shares trip info 24/7—so you can run the boat and grow the business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <button
                onClick={handleGetStarted}
                data-cta="hero_get_started"
                className="bg-teal-400 hover:bg-teal-300 text-[#0b1f3a] px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-300 focus-visible:ring-offset-[#0b1f3a]"
              >
                🎣 Get started now
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 text-blue-100/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-300" />
                <span>5‑minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-300" />
                <span>Works with call forwarding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-300" />
                <span>Reliable at sea</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section id="benefits" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built for fishing captains</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Educate callers, capture trips, and keep your calendar full—without hiring a full-time receptionist.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<Clock className="w-6 h-6 text-white" />}
              title="24/7 availability"
              blurb="Answers every call day or night—no voicemails, no missed leads."
              tone="blue"
            />
            <BenefitCard
              icon={<Users className="w-6 h-6 text-white" />}
              title="Smarter booking"
              blurb="Collects name, dates, group size, and contact info for easy follow‑up."
              tone="teal"
            />
            <BenefitCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              title="Proven to convert"
              blurb="Helpful scripts that turn questions into paid trips."
              tone="indigo"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Setup in minutes, not hours</h2>
            <p className="text-lg text-gray-600">Get your AI deckhand ready in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Tell us about your charter"
              blurb="Boat details, target species, seasons, departure marina, and policies."
              icon={<Map className="w-5 h-5 text-white" />}
            />
            <StepCard
              step={2}
              title="Set up your carrier forwarding"
              blurb="We provide a dedicated line and easy forwarding instructions for your carrier."
              icon={<Navigation className="w-5 h-5 text-white" />}
            />
            <StepCard
              step={3}
              title="Start taking calls"
              blurb="Your assistant answers, educates, and captures bookings 24/7."
              icon={<Phone className="w-5 h-5 text-white" />}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to run full</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A rugged, reliable phone assistant tuned for coastal conditions and real charter operations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Sea‑ready reliability",
                blurb: "Call handling that stays responsive even with spotty marina Wi‑Fi.",
                icon: <LifeBuoy className="w-5 h-5" />,
              },
              {
                title: "Trip education",
                blurb: "Answers FAQs about seasons, species, what to bring, and pricing.",
                icon: <Compass className="w-5 h-5" />,
              },
              {
                title: "Lead capture",
                blurb: "Saves caller name, date window, group size, and phone for follow‑up.",
                icon: <Users className="w-5 h-5" />,
              },
              {
                title: "Instant SMS notifications",
                blurb: "Get a text with every lead so nothing slips through the net.",
                icon: <Zap className="w-5 h-5" />,
              },
              {
                title: "Captain dashboard",
                blurb: "See recent calls and leads in one simple place.",
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                title: "Fast setup",
                blurb: "Be live in under 5 minutes—no coding required.",
                icon: <CheckCircle className="w-5 h-5" />,
              },
            ].map((f, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-gray-600">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Captain Pro
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-6">
                Everything you need to never miss a booking
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">AI phone assistant 24/7</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    Unlimited customer calls
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    Smart booking collection
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">SMS notifications</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Customer dashboard</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">5-minute setup</span>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                data-cta="pricing_pro"
                className="w-full bg-teal-400 hover:bg-teal-300 text-[#0b1f3a] px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                Get Captain Pro
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-500 mt-3">Cancel anytime • No setup fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Frequently asked questions</h2>
            <p className="text-gray-600">Everything you need to know before you set sail.</p>
          </div>
          <dl className="space-y-6">
            <FAQItem q="Will it work when I’m offshore?" a="Yes. Your callers reach our cloud system via your forwarded number, so the assistant answers even when your cell has no signal." />
            <FAQItem q="How fast is setup?" a="About five minutes. Pick a number and follow the carrier forwarding steps we provide." />
            <FAQItem q="Can it answer trip questions?" a="Yep. We preload your seasons, target species, policies, what to bring, and pricing details." />
            <FAQItem q="What about spam calls?" a="We screen and prioritize real customers, and you can block numbers from your dashboard." />
            <FAQItem q="Can I cancel anytime?" a="Absolutely. No contracts or hidden fees." />
          </dl>
          <div className="text-center mt-10">
            <button
              onClick={handleGetStarted}
              data-cta="faq_get_started"
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-[#0b1f3a] to-[#0a1a30]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to fill the calendar?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Put a dependable AI deckhand on the phone and keep your lines tight.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={handleGetStarted}
              data-cta="footer_get_started"
              className="bg-teal-400 hover:bg-teal-300 text-[#0b1f3a] px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <Zap className="w-5 h-5" />
              Get started free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#08162a] text-blue-100/80 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-[#1e3a8a] rounded flex items-center justify-center">
                  <Anchor className="w-4 h-4 text-blue-100" />
                </div>
                <span className="text-white font-semibold">CaptainAI</span>
              </div>
              <p className="text-sm">
                AI phone assistants for fishing charter captains
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <button
                  onClick={handleGetStarted}
                  className="block hover:text-white transition-colors text-left"
                >
                  Get Started
                </button>
                <button
                  onClick={handleGetStarted}
                  className="block hover:text-white transition-colors text-left"
                >
                  Pricing
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/" className="block hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-900 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 CaptainAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Small helper components (UI-only, reusable) ---
function WaveDivider() {
  return (
    <div className="relative" aria-hidden>
      <svg className="absolute -bottom-[1px] left-0 w-full" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path fill="#ffffff" d="M0,64L48,69.3C96,75,192,85,288,96C384,107,480,117,576,112C672,107,768,85,864,69.3C960,53,1056,43,1152,58.7C1248,75,1344,117,1392,138.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
      </svg>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  blurb,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  tone: "blue" | "teal" | "indigo";
}) {
  const toneMap: Record<string, { bg: string; ring: string }> = {
    blue: { bg: "bg-blue-600", ring: "ring-blue-100" },
    teal: { bg: "bg-teal-500", ring: "ring-teal-100" },
    indigo: { bg: "bg-indigo-600", ring: "ring-indigo-100" },
  };
  const t = toneMap[tone];
  return (
    <div className="text-left p-6 rounded-xl bg-white border border-gray-200">
      <div className={`w-12 h-12 ${t.bg} rounded-lg flex items-center justify-center mb-4 ring-4 ${t.ring}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600">{blurb}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  blurb,
  icon,
}: {
  step: number;
  title: string;
  blurb: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-left bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-[#0b1f3a] text-white rounded-full flex items-center justify-center text-base font-bold">
          {step}
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm">{blurb}</p>
    </div>
  );
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-teal-500" />
      <span className="text-gray-700">{text}</span>
    </li>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <dt className="font-semibold text-gray-900">{q}</dt>
      <dd className="mt-2 text-gray-600 text-sm leading-relaxed">{a}</dd>
    </div>
  );
}

function HeadsetIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1118 0v3a3 3 0 01-3 3h-2v-6h5" />
      <path d="M6 15v3a3 3 0 003 3h2" />
    </svg>
  );
}
