'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAdminInfo } from '@/hooks/useAdminInfo';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';

const ClientAuthSection = dynamic(() => import('./ClientAuthSection'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-3">
      <div className="w-20 h-6 bg-charcoal-100 rounded animate-pulse"></div>
      <div className="w-16 h-8 bg-charcoal-100 rounded animate-pulse"></div>
    </div>
  )
});

const ClientMobileAuthSection = dynamic(() => import('./ClientMobileAuthSection'), {
  ssr: false,
  loading: () => (
    <div className="px-3 py-2">
      <div className="w-32 h-4 bg-charcoal-100 rounded animate-pulse mb-3"></div>
      <div className="w-20 h-8 bg-charcoal-100 rounded animate-pulse"></div>
    </div>
  )
});

export default function Navbar() {
  const { adminInfo } = useAdminInfo();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/order', label: 'Order Prints' },
    { href: '/templates', label: 'Templates' },
    { href: '/my-orders', label: 'My Orders' },
    { href: '/my-templates', label: 'My Templates', requireAuth: true },
    { href: '/contact', label: 'Contact' },
  ].filter(link => !link.requireAuth || isAuthenticated);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass shadow-elevation-2'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 group">
              <span className="font-display text-2xl font-bold text-charcoal-900 tracking-tight">
                {adminInfo?.name || 'Fun Printing'}
                <span className="inline-block w-2 h-2 rounded-full bg-ink-500 ml-1 group-hover:scale-125 transition-transform"></span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-charcoal-700 hover:text-charcoal-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-ink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Link>
              ))}
            </div>
            {/* Cart — utility icon */}
            <div className="flex items-center ml-4 pl-4 border-l border-charcoal-200/50">
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 text-charcoal-700 hover:text-ink-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors group"
                title="View Cart"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                Cart
              </Link>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center ml-4 pl-4 border-l border-charcoal-200/50">
              <ClientAuthSection />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-100/50 focus:outline-none focus:ring-2 focus:ring-ink-500/20 transition-all"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass px-4 pt-2 pb-4 border-t border-charcoal-200/30">
          <div className="animate-stagger">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-charcoal-700 hover:text-ink-500 hover:bg-ink-50 block px-4 py-2.5 rounded-lg text-base font-medium transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Authentication Section */}
          <div className="border-t border-charcoal-200/30 pt-4 mt-3">
            <ClientMobileAuthSection onMenuClose={() => setIsMenuOpen(false)} />
          </div>
        </div>
      </div>
    </nav>
  );
}
