import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            username: username,
                        }
                    }
                });
                if (error) throw error;
                // Suggest checking email
                alert('Account created! Please check your email to verify.');
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} className="text-white/70" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Join Updock'}
                        </h2>
                        <p className="text-white/50 text-sm mb-8">
                            {isLogin ? 'Sign in to access your account' : 'Start your journey with us today'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                {!isLogin && (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">First Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                                        placeholder="John"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Last Name</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                                        placeholder="Doe"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Username (Pseudo)</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                                    placeholder="CaptainDock"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                            placeholder="••••••••"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-white/50 hover:text-white text-sm transition-colors"
                            >
                                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
