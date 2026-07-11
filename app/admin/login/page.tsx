'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Admin Login Page (Task 19.2)
 *
 * Requirements: 12.3
 *
 * - Login form with username + password fields
 * - Calls POST /api/auth/login
 * - Redirects to /admin/dashboard on success (200)
 * - Shows "Invalid credentials" message on 401
 * - Shows generic error on other failures
 *
 * This is a Client Component because it handles form state and
 * uses useRouter for programmatic navigation.
 */

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Form status
// ---------------------------------------------------------------------------

type FormStatus = 'idle' | 'submitting' | 'error';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminLoginPage() {
  const router = useRouter();
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onBlur',
  });

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = async (data: LoginFormValues) => {
    setFormStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      if (res.ok) {
        // Credentials valid — navigate to admin dashboard
        router.push('/admin/dashboard');
        return;
      }

      if (res.status === 401) {
        setFormStatus('error');
        setErrorMessage('Invalid username or password. Please try again.');
        return;
      }

      // Any other unexpected error
      setFormStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    } catch {
      // Network error
      setFormStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isSubmitting = formStatus === 'submitting';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B3B] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">LN Boys PG</h1>
            <p className="mt-1 text-sm text-gray-400">Admin Panel</p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Admin login form"
            className="space-y-5"
          >
            {/* ---------------------------------------------------------------- */}
            {/* Error banner                                                       */}
            {/* ---------------------------------------------------------------- */}
            {formStatus === 'error' && errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="p-4 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm"
              >
                {errorMessage}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Username                                                           */}
            {/* ---------------------------------------------------------------- */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Username{' '}
                <span aria-hidden="true" className="text-red-400">
                  *
                </span>
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                aria-required="true"
                aria-invalid={!!errors.username}
                aria-describedby={
                  errors.username ? 'login-username-error' : undefined
                }
                disabled={isSubmitting}
                placeholder="Admin username"
                className={[
                  'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  errors.username ? 'border-red-500' : 'border-white/20',
                ].join(' ')}
                {...register('username')}
              />
              {errors.username && (
                <p
                  id="login-username-error"
                  role="alert"
                  className="mt-1 text-xs text-red-400"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Password                                                           */}
            {/* ---------------------------------------------------------------- */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password{' '}
                <span aria-hidden="true" className="text-red-400">
                  *
                </span>
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'login-password-error' : undefined
                }
                disabled={isSubmitting}
                placeholder="Password"
                className={[
                  'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  errors.password ? 'border-red-500' : 'border-white/20',
                ].join(' ')}
                {...register('password')}
              />
              {errors.password && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="mt-1 text-xs text-red-400"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Submit button — spinner while in-flight                           */}
            {/* ---------------------------------------------------------------- */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className={[
                'w-full py-3 px-6 rounded-lg font-bold text-[#0B0B3B] transition-colors duration-200',
                'flex items-center justify-center gap-2',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                isSubmitting
                  ? 'bg-yellow-300 cursor-not-allowed opacity-70'
                  : 'bg-[#F5C518] hover:bg-yellow-400',
              ].join(' ')}
            >
              {isSubmitting ? (
                <>
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin text-[#0B0B3B]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
