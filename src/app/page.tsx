
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { generateLocalBusinessStructuredData, generateOrganizationStructuredData, generateServiceStructuredData, combineStructuredData } from '@/lib/seo';
import { PrinterIcon, PaletteIcon, BookIcon, DocumentIcon, MoneyIcon, DollarIcon, RocketIcon, MemoIcon } from '@/components/SocialIcons';

const services = [
  { title: 'B/W Prints', description: 'Crisp, high-contrast black and white printing for documents and assignments', icon: PrinterIcon, priceKey: 'bw' },
  { title: 'Color Prints', description: 'Vivid color reproduction for presentations, posters, and creative work', icon: PaletteIcon, priceKey: 'color' },
  { title: 'Binding', description: 'Professional spiral and hardcover binding for a polished finish', icon: BookIcon, priceKey: 'binding' },
  { title: 'Templates', description: 'Professionally designed document templates ready to customize', icon: DocumentIcon, priceKey: 'resumeTemplate' },
];

const steps = [
  { num: '01', title: 'Create Template', desc: 'Upload your DOCX file with placeholders', icon: MemoIcon },
  { num: '02', title: 'Set Your Price', desc: 'Choose your earning amount per download', icon: DollarIcon },
  { num: '03', title: 'Get Discovered', desc: 'Users find and purchase your template', icon: RocketIcon },
  { num: '04', title: 'Earn Money', desc: 'Receive payments to UPI or bank account', icon: MoneyIcon },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

export default function Home() {
  const [pricing, setPricing] = useState<any>(null);
  const [, setIsLoading] = useState(true);

  const servicesSection = useInView();
  const featuresSection = useInView();
  const earnSection = useInView();
  const ctaSection = useInView();

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();
        if (data.success) setPricing(data.pricing);
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPricing();
  }, []);

  useEffect(() => {
    const injectStructuredData = async () => {
      try {
        const adminResponse = await fetch('/api/admin/info');
        const adminData = await adminResponse.json();
        const adminInfo = adminData.success ? adminData.admin : null;
        const localBusiness = generateLocalBusinessStructuredData(adminInfo);
        const organization = generateOrganizationStructuredData(adminInfo);
        const bwService = generateServiceStructuredData('Black and White Printing', 'High-quality black and white printing services for documents, assignments, and reports');
        const colorService = generateServiceStructuredData('Color Printing', 'Vibrant color printing services for presentations, posters, and marketing materials');
        const bindingService = generateServiceStructuredData('Document Binding', 'Professional binding services for reports, thesis, and documents');
        const allStructuredData = combineStructuredData(localBusiness, organization, bwService, colorService, bindingService);
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-seo="true"]');
        existingScripts.forEach(script => script.remove());
        allStructuredData.forEach((data, index) => {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.setAttribute('data-seo', 'true');
          script.id = `structured-data-${index}`;
          script.textContent = JSON.stringify(data);
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error('Error injecting structured data:', error);
      }
    };
    injectStructuredData();
  }, []);

  const getServicePrice = (priceKey: string) => {
    if (!pricing) return <span className="text-charcoal-400 text-sm animate-pulse">Loading...</span>;
    let original = 0, discounted = 0, label = '/page'; const discount = '50% OFF';
    switch (priceKey) {
      case 'bw':
        original = pricing.basePrices.A4 * 2; discounted = pricing.basePrices.A4; break;
      case 'color':
        original = (pricing.basePrices.A4 * pricing.multipliers.color) * 2;
        discounted = pricing.basePrices.A4 * pricing.multipliers.color; break;
      case 'binding':
        original = pricing.additionalServices.binding * 2;
        discounted = pricing.additionalServices.binding; label = ''; break;
      case 'resumeTemplate':
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm text-charcoal-400 line-through">₹100</span>
            <span className="text-2xl font-bold text-ink-500 font-display">Free</span>
            <span className="text-xs font-semibold text-ink-500 bg-ink-50 px-2 py-0.5 rounded-full">100% OFF</span>
          </div>
        );
      default: return 'N/A';
    }
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm text-charcoal-400 line-through">₹{original}{label}</span>
        <span className="text-2xl font-bold text-ink-500 font-display">₹{discounted}{label}</span>
        <span className="text-xs font-semibold text-ink-500 bg-ink-50 px-2 py-0.5 rounded-full">{discount}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-charcoal-900">
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-ink-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gold-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        {/* Decorative lines */}
        <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent via-ink-500/30 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <div className="animate-stagger">
            <p className="text-ink-400 text-sm font-semibold uppercase tracking-ultra mb-6">
              Professional Printing Service
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream-100 mb-6 tracking-tight leading-none">
              Print with
              <span className="relative inline-block ml-3 md:ml-4">
                <span className="text-ink-500">precision</span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-ink-500 to-ink-400 rounded-full" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-charcoal-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Fast, reliable printing delivered to your hostel.
              <br className="hidden sm:block" />
              Upload documents or choose from professional templates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/order" className="group relative inline-flex items-center justify-center px-8 py-4 bg-ink-500 text-white rounded-xl text-lg font-semibold overflow-hidden transition-all duration-300 hover:bg-ink-600 hover:shadow-ink-lg hover:-translate-y-0.5">
                <span className="relative z-10">Order Now</span>
              </Link>
              <Link href="/templates" className="inline-flex items-center justify-center px-8 py-4 border-2 border-charcoal-600 text-cream-200 rounded-xl text-lg font-semibold hover:border-cream-400 hover:text-cream-100 transition-all duration-300 hover:-translate-y-0.5">
                Browse Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-100 to-transparent" />
      </section>

      {/* ===== SERVICES ===== */}
      <section ref={servicesSection.ref} className="py-24 bg-cream-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${servicesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-ink-500 text-sm font-semibold uppercase tracking-ultra mb-3">What We Offer</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal-900 mb-4">Our Printing Services</h2>
            <p className="text-charcoal-500 text-lg max-w-xl mx-auto">Everything you need for your academic printing — professional quality at student-friendly prices</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <div key={i}
                className={`card-elevated p-8 text-center relative group transition-all duration-700 ${servicesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100 + 200}ms` }}
              >
                {/* Offer ribbon */}
                <div className="absolute -top-px -right-px">
                  <div className="bg-ink-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl tracking-wide">OFFER</div>
                </div>
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-charcoal-900 flex items-center justify-center group-hover:bg-ink-500 transition-colors duration-300">
                  <service.icon size={28} className="w-7 h-7 text-cream-100" />
                </div>
                <h3 className="font-display text-xl font-bold text-charcoal-900 mb-2">{service.title}</h3>
                <p className="text-charcoal-500 text-sm mb-5 leading-relaxed">{service.description}</p>
                <div>{getServicePrice(service.priceKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section ref={featuresSection.ref} className="py-24 bg-white relative paper-texture">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-700 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-ink-500 text-sm font-semibold uppercase tracking-ultra mb-3">Why Us</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal-900 mb-8">Why Choose Fun&nbsp;Printing?</h2>
              <div className="space-y-6">
                {[
                  { title: 'Fast Delivery', desc: 'Get your prints delivered to your hostel within 24 hours' },
                  { title: 'Quality Guaranteed', desc: 'Professional printing quality with satisfaction guarantee' },
                  { title: 'Secure Payment', desc: 'Safe and secure payment through Razorpay' },
                ].map((feat, i) => (
                  <div key={i} className={`flex items-start gap-4 transition-all duration-700 ${featuresSection.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: `${i * 150 + 300}ms` }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-ink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900 text-lg">{feat.title}</h3>
                      <p className="text-charcoal-500 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`transition-all duration-700 delay-300 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="glass-dark rounded-2xl p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ink-500 via-gold-500 to-ink-500" />
                <h3 className="font-display text-3xl font-bold text-cream-100 mb-3">Ready to Get Started?</h3>
                <p className="text-charcoal-300 mb-8">Upload your documents or choose from our professional templates</p>
                <div className="space-y-3">
                  <Link href="/order" className="block w-full bg-ink-500 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-ink-600 hover:shadow-ink transition-all duration-300 hover:-translate-y-0.5">
                    Upload &amp; Print
                  </Link>
                  <Link href="/templates" className="block w-full bg-transparent border-2 border-charcoal-600 text-cream-200 py-3.5 px-6 rounded-xl font-semibold hover:border-cream-400 hover:text-cream-100 transition-all duration-300">
                    Browse Templates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EARN MONEY ===== */}
      <section ref={earnSection.ref} className="py-24 bg-cream-200/50 relative overflow-hidden">
        {/* Decorative mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-ink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`card-elevated p-10 md:p-14 border-t-4 border-t-ink-500 transition-all duration-700 ${earnSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-ink-500 to-ink-600 flex items-center justify-center shadow-ink">
                <MoneyIcon size={32} className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-charcoal-900 mb-4">Earn Money Creating Templates</h2>
              <p className="text-charcoal-500 text-lg max-w-2xl mx-auto">Turn your document templates into passive income. Create once, earn every time someone uses your template.</p>
            </div>

            {/* Timeline steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {steps.map((step, i) => (
                <div key={i} className={`text-center relative transition-all duration-700 ${earnSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 120 + 300}ms` }}>
                  {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-charcoal-200 to-transparent" />}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-charcoal-900 flex items-center justify-center relative">
                    <step.icon size={24} className="w-6 h-6 text-cream-100" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-ink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{step.num}</span>
                  </div>
                  <h3 className="font-semibold text-charcoal-900 mb-1">{step.title}</h3>
                  <p className="text-charcoal-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/templates/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-ink-500 to-ink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-ink-600 hover:to-ink-700 transition-all duration-300 shadow-ink hover:shadow-ink-lg hover:-translate-y-0.5">
                <PaletteIcon size={20} className="w-5 h-5" />
                Start Creating &amp; Earn
              </Link>
              <p className="text-sm text-charcoal-500 mt-4">
                Already have templates? <Link href="/my-templates" className="text-ink-500 hover:text-ink-600 font-medium link-underline">Manage your templates</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section ref={ctaSection.ref} className="relative py-24 bg-charcoal-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ink-500/8 rounded-full blur-3xl" />

        <div className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-cream-100 mb-6 tracking-tight">
            Don&apos;t Wait,<br />
            <span className="text-ink-400">Print Today</span>
          </h2>
          <p className="text-xl text-charcoal-300 mb-10 max-w-xl mx-auto">
            Join thousands of students who trust Fun Printing for fast, affordable, professional prints
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order" className="inline-flex items-center justify-center px-8 py-4 bg-ink-500 text-white rounded-xl text-lg font-semibold hover:bg-ink-600 hover:shadow-ink-lg transition-all duration-300 hover:-translate-y-0.5">
              Start Printing Now
            </Link>
            <Link href="/templates/create" className="inline-flex items-center justify-center px-8 py-4 border-2 border-charcoal-600 text-cream-200 rounded-xl text-lg font-semibold hover:border-cream-400 hover:text-cream-100 transition-all duration-300 hover:-translate-y-0.5">
              Create Templates &amp; Earn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
