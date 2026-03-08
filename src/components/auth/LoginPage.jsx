import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-[#050506] to-[#050506]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl mx-auto mb-5">
            <Zap size={32} className="text-[#050506]" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">VeloCity</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-2 tracking-wide">AI Content Suite for Creators</p>
        </div>

        <div className="bg-[#0a0a0b] rounded-3xl border border-white/[0.06] p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters" required minLength={8}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/10 bg-white/[0.03] accent-blue-500"
                />
                <span className="text-[11px] text-zinc-500">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[11px] text-blue-400 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-white text-[#050506] py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[13px] text-zinc-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-medium">Create one</Link>
          </p>
        </div>

        <div className="mt-7 text-center">
          <p className="text-[10px] text-zinc-700 font-medium tracking-wide">Vishal &middot; Bhumika &middot; Shlok &middot; Soham</p>
          <p className="text-[9px] text-zinc-800 mt-0.5">Rizvi College AI Competition</p>
        </div>
      </div>
    </div>
  );
}
