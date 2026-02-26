import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function PasswordStrengthMeter({ password }) {
  const analysis = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    let label = 'Weak';
    let color = '#ef4444';
    if (passed >= 5) { label = 'Strong'; color = '#22c55e'; }
    else if (passed >= 4) { label = 'Good'; color = '#3b82f6'; }
    else if (passed >= 3) { label = 'Fair'; color = '#f59e0b'; }
    return { checks, passed, label, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= analysis.passed ? analysis.color : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
      <p className="text-[10px] font-semibold tracking-wider" style={{ color: analysis.color }}>
        {analysis.label}
      </p>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {[
          ['length', '8+ characters'],
          ['uppercase', 'Uppercase'],
          ['lowercase', 'Lowercase'],
          ['number', 'Number'],
          ['special', 'Special char'],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px]">
            {analysis.checks[key]
              ? <Check size={10} className="text-green-400" />
              : <X size={10} className="text-zinc-600" />
            }
            <span className={analysis.checks[key] ? 'text-zinc-400' : 'text-zinc-600'}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [niche, setNiche] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName.trim(), niche.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <h2 className="text-xl font-bold text-white mb-6">Create your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your unique creator name" required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">
                Password <span className="text-red-400">*</span>
              </label>
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
              <PasswordStrengthMeter password={password} />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">Content Niche</label>
              <input
                type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder='e.g. "Mumbai Street Food" or "Tech Reviews"'
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-white text-[#050506] py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
