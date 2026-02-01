'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Email atau password salah');
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError('Terjadi kesalahan, coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="admin@example.com"
                    required
                />
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="••••••••"
                    required
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3"
            >
                {loading ? '⏳ Masuk...' : '🔐 Masuk'}
            </Button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <Card className="w-full max-w-md bg-gray-900/80 border-gray-800 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="text-4xl mb-4">📜</div>
                    <CardTitle className="text-2xl text-white">PUU Tracker</CardTitle>
                    <p className="text-gray-400 text-sm mt-2">
                        Masuk untuk mengelola peraturan
                    </p>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="text-gray-400 text-center py-4">Loading...</div>}>
                        <LoginForm />
                    </Suspense>

                    <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <p className="text-xs text-gray-500 text-center">
                            💡 Demo: admin@puu.local / admin123
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

