'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (resetParam === 'success') {
      setSuccess('Password reset successfully! You can now sign in with your new password.');
      // Clear the query parameter
      router.replace('/auth/signin');
    }
  }, [searchParams, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Please verify your email address before signing in. Check your inbox for a verification email.');
          setShowResend(true);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Get the updated session
        const session = await getSession();
        if (session) {
          // Check if profile is complete
          try {
            const profileCheck = await fetch('/api/user/check-profile-complete');
            const profileData = await profileCheck.json();
            
            if (profileData.success && !profileData.isComplete) {
              router.push('/complete-profile');
            } else {
              router.push('/my-orders');
            }
          } catch (error) {
            console.error('Error checking profile:', error);
          router.push('/my-orders');
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Redirect to a page that will check profile completeness
      await signIn('google', { callbackUrl: '/auth/check-profile' });
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setError('Verification email sent successfully! Please check your inbox.');
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a46 100%)' }}>
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-md px-12 text-center">
          {/* Ink dot accent */}
          <div className="w-3 h-3 rounded-full mx-auto mb-8"
            style={{ background: '#e94560' }} />

          <h1 className="text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.15 }}>
            Welcome back.
          </h1>
          <p className="text-lg leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}>
            Your documents deserve precision. Sign in to manage your print orders and templates.
          </p>

          {/* Decorative line */}
          <div className="mt-10 mx-auto w-16 h-px"
            style={{ background: 'rgba(233, 69, 96, 0.5)' }} />
          <p className="mt-4 text-xs uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            Fun Printing
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#faf8f5' }}>
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-2.5 h-2.5 rounded-full mx-auto mb-4"
              style={{ background: '#e94560' }} />
            <h1 className="text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
              Sign In
            </h1>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="text-xs uppercase tracking-[0.15em] mb-3"
              style={{ color: '#e94560', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Account
            </p>
            <h2 className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a1a2e' }}>
              Sign in to your account
            </h2>
            <p className="text-sm" style={{ color: '#72729e' }}>
              Or{' '}
              <Link href="/auth/signup"
                className="font-medium hover:underline"
                style={{ color: '#e94560' }}>
                create a new account
              </Link>
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl p-8"
            style={{
              background: 'white',
              border: '1px solid rgba(26,26,46,0.06)',
              boxShadow: '0 4px 24px rgba(26,26,46,0.06)'
            }}>
            {success && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                {error}
              </div>
            )}

            {showResend && (
              <div className="mb-4 p-3 rounded-xl"
                style={{ background: 'var(--color-ink-50)', border: '1px solid var(--color-ink-100)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--color-ink-600)' }}>
                  Need to resend the verification email?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full py-2 px-4 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'white',
                    border: '1px solid var(--color-ink-200)',
                    color: 'var(--color-ink-600)',
                  }}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'white',
                border: '2px solid rgba(26,26,46,0.1)',
                color: '#1a1a2e',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(26,26,46,0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,26,46,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,26,46,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(26,26,46,0.08)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs" style={{ background: 'white', color: '#a3a3c2' }}>
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form className="space-y-4" onSubmit={handleEmailSignIn}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1.5"
                  style={{ color: '#1a1a2e' }}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    border: '2px solid rgba(26,26,46,0.1)',
                    background: 'white',
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#e94560'; e.target.style.boxShadow = '0 0 0 3px rgba(233,69,96,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(26,26,46,0.1)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1.5"
                  style={{ color: '#1a1a2e' }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{
                    border: '2px solid rgba(26,26,46,0.1)',
                    background: 'white',
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#e94560'; e.target.style.boxShadow = '0 0 0 3px rgba(233,69,96,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(26,26,46,0.1)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm font-medium"
                  style={{ color: '#e94560' }}>
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #e94560, #d52a4a)',
                  boxShadow: '0 4px 16px rgba(233, 69, 96, 0.25)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(233,69,96,0.3)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(233,69,96,0.25)'; }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Mobile sign up link */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-sm" style={{ color: '#72729e' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium" style={{ color: '#e94560' }}>
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm" style={{ color: '#a3a3c2' }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
            style={{ borderBottom: '2px solid #e94560' }} />
          <p style={{ color: '#72729e' }}>Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
