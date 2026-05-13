'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToasterProvider from '@/components/ToasterProvider';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    // For admin routes, don't show navbar or footer
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
  
  // For regular routes, show navbar and footer
  return (
    <>
      <ToasterProvider />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
