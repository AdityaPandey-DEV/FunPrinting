'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface ClientMobileAuthSectionProps {
  onMenuClose: () => void;
}

// Helper function to get user initial
function getUserInitial(name?: string | null, email?: string | null): string {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return '?';
}

// Helper function to get background color based on initial
function getInitialColor(initial: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];
  const index = initial.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function ClientMobileAuthSection({ onMenuClose }: ClientMobileAuthSectionProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (isAuthenticated) {
    const profileImage = user?.image || (user as any)?.profilePicture;
    const initial = getUserInitial(user?.name, user?.email);
    const bgColor = getInitialColor(initial);
    const showImage = profileImage && !imageError;

    return (
      <div className="px-3 py-2">
        <Link
          href="/profile"
          onClick={onMenuClose}
          className="flex items-center space-x-3 mb-3 p-2 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(233,69,96,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: 'rgba(26,26,46,0.15)' }}>
            {showImage ? (
              <img
                src={profileImage}
                alt={user?.name || 'Profile'}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`w-full h-full ${bgColor} flex items-center justify-center text-white font-semibold text-lg`}>
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#1a1a2e' }}>
              {user?.name || user?.email}
            </div>
            <div className="text-xs" style={{ color: '#a3a3c2' }}>View Profile</div>
          </div>
        </Link>
        <button
          onClick={() => {
            logout();
            onMenuClose();
          }}
          className="block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 w-full text-left"
          style={{ color: '#515182' }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-2">
      <Link
        href="/auth/signin"
        className="block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200"
        style={{ color: '#515182' }}
        onClick={onMenuClose}
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="text-white block px-3 py-2 rounded-xl text-base font-semibold transition-colors text-center"
        style={{
          background: 'linear-gradient(135deg, #e94560, #d52a4a)',
          boxShadow: '0 2px 8px rgba(233, 69, 96, 0.2)',
        }}
        onClick={onMenuClose}
      >
        Sign Up
      </Link>
    </div>
  );
}
