'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminInfo } from '@/hooks/useAdminInfo';
import { DocumentIcon, TruckIcon } from '@/components/SocialIcons';

export default function ContactPage() {
  const { adminInfo } = useAdminInfo();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 2000);
  };

  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'You can track your order by visiting the "My Orders" page and entering your order ID or phone number.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major payment methods including UPI, credit/debit cards, net banking, and digital wallets through Razorpay.'
    },
    {
      q: 'Can I delete my order?',
      a: 'Pending payment orders can be deleted before payment is completed. Once payment is completed, please contact us for refund requests.'
    },
    {
      q: 'What file formats do you support?',
      a: 'We support PDF, DOCX, JPG, JPEG, and PNG files for printing.'
    },
  ];

  const contactItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      primary: adminInfo?.phone || '+91 98765 43210',
      secondary: adminInfo?.businessHours ? `${adminInfo.businessHours.monday} - ${adminInfo.businessHours.saturday}` : 'Mon-Sat: 9AM-6PM',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      primary: adminInfo?.email || 'info@printservice.com',
      secondary: 'We respond within 24 hours',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Address',
      primary: adminInfo?.address
        ? `${adminInfo.address}, ${adminInfo.city}`
        : 'Business Address',
      secondary: adminInfo?.state
        ? `${adminInfo.state} - ${adminInfo.pincode}, ${adminInfo.country}`
        : 'India',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Business Hours',
      primary: adminInfo?.businessHours
        ? `Mon-Sat: ${adminInfo.businessHours.monday}`
        : 'Monday - Saturday: 9AM - 6PM',
      secondary: adminInfo?.businessHours?.sunday || 'Sunday: Closed',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a46 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="w-3 h-3 rounded-full mx-auto mb-6" style={{ background: '#e94560' }} />
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Get in Touch
          </h1>
          <p className="text-lg max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            We&apos;re here to help with your printing needs. Reach out and we&apos;ll respond promptly.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 pb-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Cards — Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {contactItems.map((item, i) => (
              <div key={i} className="rounded-2xl p-6"
                style={{
                  background: 'white',
                  border: '1px solid rgba(26,26,46,0.06)',
                  boxShadow: '0 2px 12px rgba(26,26,46,0.04)',
                }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#1a1a2e', color: 'white' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#1a1a2e' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm" style={{ color: '#515182' }}>{item.primary}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a3a3c2' }}>{item.secondary}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Links */}
            <div className="rounded-2xl p-6"
              style={{
                background: 'white',
                border: '1px solid rgba(26,26,46,0.06)',
                boxShadow: '0 2px 12px rgba(26,26,46,0.04)',
              }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>
                Quick Support
              </h3>
              <div className="space-y-2.5">
                {[
                  { href: '/cancellation-refund', icon: <DocumentIcon size={14} className="w-3.5 h-3.5" />, text: 'Cancellation & Refund Policy' },
                  { href: '/shipping-delivery', icon: <TruckIcon size={14} className="w-3.5 h-3.5" />, text: 'Shipping & Delivery Policy' },
                  { href: '/terms', icon: <DocumentIcon size={14} className="w-3.5 h-3.5" />, text: 'Terms & Conditions' },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center gap-2 text-sm py-1.5 hover:translate-x-1"
                    style={{ color: '#e94560', transition: 'transform 0.2s ease' }}>
                    {link.icon}
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form — Right Column */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-8"
              style={{
                background: 'white',
                border: '1px solid rgba(26,26,46,0.06)',
                boxShadow: '0 4px 24px rgba(26,26,46,0.06)',
              }}>
              <p className="text-xs uppercase tracking-[0.15em] mb-2"
                style={{ color: '#e94560', fontWeight: 600 }}>
                Message
              </p>
              <h2 className="text-2xl font-bold mb-6"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
                Send us a message
              </h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                  Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1a2e' }}>
                      Full Name *
                    </label>
                    <input type="text" id="contact-name" name="name" required
                      value={formData.name} onChange={handleInputChange}
                      className="form-input" placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1a2e' }}>
                      Phone *
                    </label>
                    <input type="tel" id="contact-phone" name="phone" required
                      value={formData.phone} onChange={handleInputChange}
                      className="form-input" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1a2e' }}>
                    Email *
                  </label>
                  <input type="email" id="contact-email" name="email" required
                    value={formData.email} onChange={handleInputChange}
                    className="form-input" placeholder="you@example.com" />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1a2e' }}>
                    Subject *
                  </label>
                  <select id="contact-subject" name="subject" required
                    value={formData.subject} onChange={handleInputChange}
                    className="form-select">
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Status</option>
                    <option value="payment">Payment Issue</option>
                    <option value="refund">Refund Request</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1a2e' }}>
                    Message *
                  </label>
                  <textarea id="contact-message" name="message" required rows={5}
                    value={formData.message} onChange={handleInputChange}
                    className="form-textarea" placeholder="Tell us how we can help..." />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="form-button form-button-primary px-10 py-3.5 text-base"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <div className="w-3 h-3 rounded-full mx-auto mb-4" style={{ background: '#e94560' }} />
            <h2 className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-sm" style={{ color: '#72729e' }}>
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{
                  background: 'white',
                  border: '1px solid rgba(26,26,46,0.06)',
                  boxShadow: '0 1px 4px rgba(26,26,46,0.03)',
                }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  style={{ color: '#1a1a2e' }}
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', color: '#a3a3c2' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}>
                  <p className="px-6 pb-4 text-sm leading-relaxed"
                    style={{ color: '#515182' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: '#1a1a2e',
              color: 'white',
              transition: 'all 0.3s ease',
            }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
