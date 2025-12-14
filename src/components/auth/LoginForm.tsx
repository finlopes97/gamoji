"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  
  // State
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // 1. Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) setMessage({ text: error.message, type: 'error' });
    setLoading(false);
  };

  // 2. Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      setLoading(false);
    } else {
      // Successful login - redirect to home
      router.push("/");
      router.refresh();
    }
  };

  // 3. Handle Email Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (username.length < 3) {
      setMessage({ text: "Username must be at least 3 characters.", type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // IMPORTANT: This passes data to your Postgres Trigger to create the Profile!
        data: {
          username: username, 
        },
      },
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ 
        text: "Account created! Please check your email to verify your account.", 
        type: 'success' 
      });
      // If you disabled 'Confirm Email' in Supabase, you can redirect immediately:
      // router.push("/"); 
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-8 text-center bg-indigo-600">
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">GAMOJI</h1>
          <p className="text-indigo-100">Sign in to track your stats</p>
        </div>

        <div className="p-8">
          
          {/* TOGGLE TABS */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
            <button
              onClick={() => { setIsSignUp(false); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                !isSignUp 
                  ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                isSignUp 
                  ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* EMAIL FORM */}
          <form onSubmit={isSignUp ? handleSignUp : handleEmailLogin} className="space-y-4">
            
            {/* Username Field (Only for Sign Up) */}
            {isSignUp && (
              <div className="relative animate-in slide-in-from-top-2 duration-300">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isSignUp ? "Create Account" : "Log In")}
            </button>
          </form>

          {/* FEEDBACK MESSAGES */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 text-sm ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}