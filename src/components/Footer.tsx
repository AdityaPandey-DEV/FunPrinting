'use client';

import Link from 'next/link';
import { useAdminInfo } from '@/hooks/useAdminInfo';
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedInIcon, YouTubeIcon, LocationIcon, EmailIcon, PhoneIcon, ClockIcon, WebsiteIcon } from '@/components/SocialIcons';

export default function Footer() {
  const { adminInfo, loading } = useAdminInfo();

  const footerLinks = [
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cancellation-refund', label: 'Cancellation & Refund' },
    { href: '/return-policy', label: 'Return & Refund Policy' },
    { href: '/shipping-delivery', label: 'Shipping & Delivery' },
    { href: '/contact', label: 'Contact Us' },
  ];

  // Helper function to get the appropriate icon component
  const getSocialIcon = (label: string) => {
    switch (label) {
      case 'Facebook':
        return FacebookIcon;
      case 'Instagram':
        return InstagramIcon;
      case 'Twitter':
        return TwitterIcon;
      case 'LinkedIn':
        return LinkedInIcon;
      case 'YouTube':
        return YouTubeIcon;
      default:
        return null;
    }
  };

  // Default social links if admin info is not available
  const defaultSocialLinks = [
    { href: '#', label: 'Facebook' },
    { href: '#', label: 'Twitter' },
    { href: '#', label: 'Instagram' },
    { href: '#', label: 'LinkedIn' },
  ];

  // Create social links from admin info
  const socialLinks = adminInfo?.socialMedia ? [
    ...(adminInfo.socialMedia.facebook ? [{ href: adminInfo.socialMedia.facebook, label: 'Facebook' }] : []),
    ...(adminInfo.socialMedia.twitter ? [{ href: adminInfo.socialMedia.twitter, label: 'Twitter' }] : []),
    ...(adminInfo.socialMedia.instagram ? [{ href: adminInfo.socialMedia.instagram, label: 'Instagram' }] : []),
    ...(adminInfo.socialMedia.linkedin ? [{ href: adminInfo.socialMedia.linkedin, label: 'LinkedIn' }] : []),
    ...(adminInfo.socialMedia.youtube ? [{ href: adminInfo.socialMedia.youtube, label: 'YouTube' }] : []),
  ] : defaultSocialLinks;

  return (
    <footer className="relative bg-charcoal-900 text-cream-100 overflow-hidden">
      {/* Decorative grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}></div>

      {/* Top decorative ink line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-ink-500 to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Company Info */}
          <div className="md:col-span-5">
            <h3 className="font-display text-2xl font-bold text-gold-500 mb-4 tracking-tight">
              {adminInfo?.name || 'Fun Printing Service'}
            </h3>
            <p className="text-charcoal-300 mb-6 leading-relaxed max-w-md">
              {adminInfo?.description || 'Your trusted printing partner for all academic needs. Fast, reliable, and affordable printing services for college students.'}
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = getSocialIcon(social.label);
                if (!IconComponent) return null;
                
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-charcoal-800 flex items-center justify-center text-charcoal-400 hover:text-ink-400 hover:bg-charcoal-700 hover:shadow-ink transition-all duration-300 group"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconComponent size={20} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold uppercase tracking-ultra text-charcoal-400 mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-charcoal-300 hover:text-cream-100 transition-colors link-underline text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-ultra text-charcoal-400 mb-5">Get in Touch</h4>
            <div className="space-y-3">
              <p className="flex items-start gap-3 text-charcoal-300 text-sm group">
                <span className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-charcoal-700 transition-colors">
                  <LocationIcon size={16} className="w-4 h-4 text-ink-400" />
                </span>
                <span className="pt-1">{adminInfo?.address ? `${adminInfo.address}, ${adminInfo.city}, ${adminInfo.state} ${adminInfo.pincode}` : 'College Campus'}</span>
              </p>
              <p className="flex items-center gap-3 text-charcoal-300 text-sm group">
                <span className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-charcoal-700 transition-colors">
                  <EmailIcon size={16} className="w-4 h-4 text-ink-400" />
                </span>
                <span>{adminInfo?.email || 'info@printservice.com'}</span>
              </p>
              <p className="flex items-center gap-3 text-charcoal-300 text-sm group">
                <span className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-charcoal-700 transition-colors">
                  <PhoneIcon size={16} className="w-4 h-4 text-ink-400" />
                </span>
                <span>{adminInfo?.phone || '+91 98765 43210'}</span>
              </p>
              <p className="flex items-center gap-3 text-charcoal-300 text-sm group">
                <span className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-charcoal-700 transition-colors">
                  <ClockIcon size={16} className="w-4 h-4 text-ink-400" />
                </span>
                <span>{adminInfo?.businessHours ? `${adminInfo.businessHours.monday} - ${adminInfo.businessHours.saturday}` : 'Mon-Sat: 9AM-6PM'}</span>
              </p>
              {adminInfo?.website && (
                <p className="flex items-center gap-3 text-charcoal-300 text-sm group">
                  <span className="w-8 h-8 rounded-lg bg-charcoal-800 flex items-center justify-center flex-shrink-0 group-hover:bg-charcoal-700 transition-colors">
                    <WebsiteIcon size={16} className="w-4 h-4 text-ink-400" />
                  </span>
                  <a href={adminInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-cream-100 transition-colors">{adminInfo.website}</a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-charcoal-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-charcoal-500 text-sm">
            &copy; {new Date().getFullYear()} <span className="text-gold-500 font-medium">{adminInfo?.name || 'Fun Printing Service'}</span>. All rights reserved.
          </p>
          <p className="text-charcoal-600 text-xs tracking-wide">
            Crafted with precision & care
          </p>
        </div>
      </div>
    </footer>
  );
}
