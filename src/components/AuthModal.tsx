import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../ui/Modal';
import Header from '../ui/Header';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const displayNameTouched = useRef(false);

    useEffect(() => {
        if (!displayNameTouched.current) {
            setDisplayName(firstName);
        }
    }, [firstName]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mapAuthError = (message: string) => {
        if (message.includes('Invalid login credentials')) return t('error.invalid_credentials');
        if (message.includes('User already registered')) return t('error.email_exists');
        if (message.includes('Password should be at least 6 characters')) return t('error.weak_password');
        return t('error.generic');
    };

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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: 'updock://auth-callback',
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            display_name: displayName,
                        }
                    }
                });
                if (error) throw error;
                if (data.user) {
                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        display_name: displayName,
                    });
                }
                alert(t('auth.alert_signup'));
                onClose();
            }
        } catch (err: any) {
            setError(mapAuthError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Header
                surface="glass"
                title={isLogin ? t('auth.title_login') : t('auth.title_signup')}
                subtitle={isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    label={t('auth.first_name')}
                                    icon={User}
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder={t('auth.placeholder_first_name')}
                                />
                                <Input
                                    label={t('auth.last_name')}
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder={t('auth.placeholder_last_name')}
                                />
                            </div>

                            <Input
                                label={t('auth.display_name')}
                                icon={User}
                                required
                                value={displayName}
                                onChange={(e) => {
                                    displayNameTouched.current = true;
                                    setDisplayName(e.target.value);
                                }}
                                placeholder={t('auth.placeholder_display_name')}
                            />
                        </>
                    )}

                    <Input
                        label={t('auth.email')}
                        icon={Mail}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.placeholder_email')}
                    />

                    <Input
                        label={t('auth.password')}
                        icon={Lock}
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.placeholder_password')}
                        minLength={6}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full mt-4"
                >
                    {isLogin ? t('auth.btn_login') : t('auth.btn_signup')}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        displayNameTouched.current = false;
                    }}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                >
                    {isLogin ? t('auth.no_account') + ' ' + t('auth.link_signup') : t('auth.have_account') + ' ' + t('auth.link_login')}
                </button>
            </div>
        </Modal>
    );
}
