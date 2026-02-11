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
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="admin@example.com"
                    required
                />
            </div>

            <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                    required
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full py-3"
            >
                {loading ? '⏳ Masuk...' : '🔐 Masuk'}
            </Button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-border/70 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="text-4xl mb-4">📜</div>
                    <CardTitle className="text-2xl text-foreground">PUU Tracker</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Masuk untuk mengelola peraturan
                    </p>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="py-4 text-center text-muted-foreground">Loading...</div>}>
                        <LoginForm />
                    </Suspense>

                    <div className="mt-6 rounded-lg border border-border/60 bg-background/60 p-4">
                        <p className="text-center text-xs text-muted-foreground">
                            💡 Demo: admin@puu.local / admin123
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
