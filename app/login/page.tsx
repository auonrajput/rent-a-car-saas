'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Eye Icon States for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match!');
        setLoading(false);
        return;
      }

      // Password Validation: Alphabets, Numbers, Special Characters check
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
      if (!passwordRegex.test(password)) {
        setMessage('Password must contain at least one alphabet, one number, and one special character!');
        setLoading(false);
        return;
      }

      // 1. Register User in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setMessage('Error signing up: ' + authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const generatedSlug = (fullName || 'tenant')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

        // 2. Create Tenant record for the user
        const { error: tenantError } = await supabase
          .from('tenants')
          .insert([
            {
              name: fullName ? `${fullName}'s Rental` : 'My Rental Agency',
              slug: generatedSlug,
            },
          ]);

        if (tenantError) {
          setMessage('Error creating tenant record: ' + tenantError.message);
        } else {
          setMessage('Account created successfully! You can now log in.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      }
    } else {
      // Login User
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-blue-400">Rent-a-Car SaaS</h1>
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Create your personal account' : 'Sign in to manage your fleet'}
          </p>
        </div>

        {message && (
          <div className="p-3 rounded bg-blue-900/40 border border-blue-700 text-sm text-blue-300 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Auon Rajput"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 pr-10 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-sm focus:outline-none"
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {isSignUp && (
              <p className="text-[10px] text-gray-400 mt-1">Must include letters, numbers & special characters.</p>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 pr-10 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-sm focus:outline-none"
                >
                  {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded transition-colors shadow disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-xs text-blue-400 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}