import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Eye, EyeOff, Check } from 'lucide-react';

// Simple hash matching AuthContext
function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'h_' + Math.abs(h).toString(36);
}

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            // Validate token from localStorage
            const stored = JSON.parse(localStorage.getItem('velocity_reset_token') || 'null');
            if (!stored || stored.token !== token || Date.now() > stored.expires) {
                throw new Error('Reset link is invalid or has expired');
            }

            // Find and update the user's password
            const users = JSON.parse(localStorage.getItem('velocity_users') || '[]');
            const idx = users.findIndex(u => u.email.toLowerCase() === stored.email);
            if (idx === -1) {
                throw new Error('User not found');
            }

            users[idx].passwordHash = simpleHash(password);
            localStorage.setItem('velocity_users', JSON.stringify(users));
            localStorage.removeItem('velocity_reset_token');

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-4">Invalid Reset Link</h2>
                    <p className="text-zinc-500 mb-6">This reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="text-blue-400 hover:underline font-medium">
                        Request a new reset link
                    </Link>
                </div>
            </div>
        );
    }

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
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Check size={28} className="text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                            <p className="text-zinc-500 text-sm mb-4">
                                Your password has been changed successfully. Redirecting to login...
                            </p>
                            <Link to="/login" className="text-blue-400 hover:underline text-sm font-medium">
                                Go to login now
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white mb-2">Set new password</h2>
                            <p className="text-zinc-500 text-sm mb-6">Enter your new password below.</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'} value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 characters" required minLength={8}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all pr-10"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1.5 block">Confirm Password</label>
                                    <input
                                        type="password" value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat your password" required
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/40 transition-all"
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    type="submit" disabled={loading || (confirmPassword && password !== confirmPassword)}
                                    className="w-full bg-white text-[#050506] py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
