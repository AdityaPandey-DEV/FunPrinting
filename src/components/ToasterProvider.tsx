'use client';

import { useEffect, useState } from 'react';

export default function ToasterProvider() {
  const [ToasterComponent, setToasterComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamic import at runtime to bypass Turbopack ESM resolution issue
    import('react-hot-toast').then((mod) => {
      setToasterComponent(() => mod.Toaster);
    });
  }, []);

  if (!ToasterComponent) return null;

  return (
    <ToasterComponent
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a2e',
          color: '#faf8f5',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          border: '1px solid rgba(233, 69, 96, 0.15)',
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            background: '#ef4444',
          },
        },
      }}
    />
  );
}
