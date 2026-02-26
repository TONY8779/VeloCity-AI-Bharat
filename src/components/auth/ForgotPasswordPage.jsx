import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [resetUrl, setResetUrl] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Client-side: check if user exists in localStorage
            const users = JSON.parse(localStorage.getItem('velocity_users') || '[]');
            const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!found) {
                // Don't reveal whether the email exists
            }
            // Generate a simple token and store it
            const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
            localStorage.setItem('velocity_reset_token', JSON.stringify({
                token,
                email: email.toLowerCase(),
                expires: Date.now() + 3600000, // 1 hour
            }));
            setSent(true);
            // Show reset URL directly (no email service in client-side mode)
            setResetUrl(`${window.location.origin}/reset-password?token=${token}`);
        } catch (err) {
            setError(err.message || 'Failed to generate reset link');
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
                </div>

                <div className="bg-[#0a0a0b] rounded-3xl border border-white/[0.06] p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail size={28} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Reset link generated</h2>
                            <p className="text-zinc-500 text-sm mb-6">
                                Since this is a client-side demo, use the link below to reset your password.
                            </p>

                            {resetUrl && (
                                <div className="mb-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-widest text-yellow-500/70 font-semibold mb-2">Reset Link</p>
                                    <a
                                        href={resetUrl}
                                        className="text-blue-400 hover:underline text-sm break-all"
                                    >
                                        {resetUrl}
                                    </a>
                                </div>
                            )}

                            <Link to="/login" className="text-blue-400 hover:underline text-sm font-medium">
                                ← Back to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white mb-2">Forgot password?</h2>
                            <p className="text-zinc-500 text-sm mb-6">Enter your email and we'll generate a reset link.</p>

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

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full bg-white text-[#050506] py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Reset Link'}
                                </button>
                            </form>

                            <p className="text-center text-[13px] text-zinc-500 mt-6">
                                <Link to="/login" className="text-blue-400 hover:underline font-medium flex items-center justify-center gap-1">
                                    <ArrowLeft size={14} /> Back to login
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
