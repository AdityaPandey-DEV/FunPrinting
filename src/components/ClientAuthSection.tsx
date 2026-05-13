'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

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

export default function ClientAuthSection() {
  const { user, isAuthenticated, logout } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (isAuthenticated) {
    const profileImage = user?.image || (user as any)?.profilePicture;
    const initial = getUserInitial(user?.name, user?.email);
    const bgColor = getInitialColor(initial);
    const showImage = profileImage && !imageError;

    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/profile"
          className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 cursor-pointer flex-shrink-0"
          style={{ borderColor: 'rgba(26,26,46,0.15)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e94560'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,26,46,0.15)'; }}
          title="View Profile"
        >
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
        </Link>
        <button
          onClick={() => logout()}
          className="text-sm px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap"
          style={{ color: '#515182' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e94560'; e.currentTarget.style.background = 'rgba(233,69,96,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#515182'; e.currentTarget.style.background = 'transparent'; }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/auth/signin"
        className="text-sm px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
        style={{ color: '#515182' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1a2e'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#515182'; }}
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #e94560, #d52a4a)',
          boxShadow: '0 2px 8px rgba(233, 69, 96, 0.2)',
        }}
      >
        Sign Up
      </Link>
    </div>
  );
}
