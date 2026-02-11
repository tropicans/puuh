'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface AIStatus {
    status: 'connected' | 'error' | 'loading' | 'idle';
    model?: string;
    error?: string;
}

interface VisionStatus {
    status: 'connected' | 'error' | 'loading' | 'idle';
    message?: string;
}

interface DBStatus {
    status: 'connected' | 'error' | 'loading' | 'idle';
    stats?: {
        regulations: number;
        versions: number;
        articles: number;
    };
    error?: string;
}

export default function SettingsPage() {
    const [aiStatus, setAIStatus] = useState<AIStatus>({ status: 'idle' });
    const [visionStatus, setVisionStatus] = useState<VisionStatus>({ status: 'idle' });
    const [dbStatus, setDBStatus] = useState<DBStatus>({ status: 'idle' });
    const [seeding, setSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState<string | null>(null);

    const testAIConnection = async () => {
        setAIStatus({ status: 'loading' });

        try {
            const response = await fetch('/api/test-ai');
            const data = await response.json();

            if (data.status === 'connected') {
                setAIStatus({
                    status: 'connected',
                    model: data.model
                });
            } else {
                setAIStatus({
                    status: 'error',
                    error: data.error || 'Gagal terhubung'
                });
            }
        } catch (error) {
            setAIStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Network error'
            });
        }
    };

    const testVisionAPI = async () => {
        setVisionStatus({ status: 'loading' });

        try {
            const response = await fetch('/api/test-vision');
            const data = await response.json();

            if (data.success) {
                setVisionStatus({
                    status: 'connected',
                    message: data.message
                });
            } else {
                setVisionStatus({
                    status: 'error',
                    message: data.message || 'Tidak terhubung'
                });
            }
        } catch (error) {
            setVisionStatus({
                status: 'error',
                message: error instanceof Error ? error.message : 'Network error'
            });
        }
    };

    const fetchDatabaseStatus = async () => {
        const response = await fetch('/api/db-status');
        return response.json();
    };

    const checkDatabase = async () => {
        setDBStatus({ status: 'loading' });

        try {
            const data = await fetchDatabaseStatus();

            if (data.connected) {
                setDBStatus({
                    status: 'connected',
                    stats: data.stats
                });
            } else {
                setDBStatus({
                    status: 'error',
                    error: data.error || 'Tidak terhubung'
                });
            }
        } catch (error) {
            setDBStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Network error'
            });
        }
    };

    // Check database connection on load
    useEffect(() => {
        async function initialCheck() {
            setDBStatus({ status: 'loading' });

            try {
                const data = await fetchDatabaseStatus();

                if (data.connected) {
                    setDBStatus({
                        status: 'connected',
                        stats: data.stats
                    });
                } else {
                    setDBStatus({
                        status: 'error',
                        error: data.error || 'Tidak terhubung'
                    });
                }
            } catch (error) {
                setDBStatus({
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Network error'
                });
            }
        }

        initialCheck();
    }, []);

    const seedDatabase = async () => {
        setSeeding(true);
        setSeedMessage(null);

        try {
            const response = await fetch('/api/seed', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                setSeedMessage('✅ ' + (data.message || 'Data berhasil di-seed'));
                checkDatabase(); // Refresh stats
            } else {
                setSeedMessage('❌ ' + (data.error || 'Gagal seed data'));
            }
        } catch (error) {
            setSeedMessage('❌ ' + (error instanceof Error ? error.message : 'Network error'));
        }

        setSeeding(false);
    };

    return (
        <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
            <div>
                <Link href="/dashboard" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="mb-2 text-3xl font-bold text-foreground">Pengaturan</h1>
                <p className="text-muted-foreground">
                    Konfigurasi database dan integrasi AI
                </p>
            </div>

            {/* AI Connection */}
            <Card className="border-border/70 bg-card/70">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <span>🤖</span>
                        Koneksi LLM / AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Base URL</div>
                            <div className="font-mono text-foreground">
                                {process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1'}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Model</div>
                            <div className="font-mono text-foreground">gpt-oss-120b-medium</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={testAIConnection}
                            disabled={aiStatus.status === 'loading'}
                            className=""
                        >
                            {aiStatus.status === 'loading' ? '⏳ Testing...' : '🔌 Test Koneksi AI'}
                        </Button>

                        {aiStatus.status === 'connected' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                                ✓ Terhubung
                            </Badge>
                        )}
                        {aiStatus.status === 'error' && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">
                                ✗ Error
                            </Badge>
                        )}
                    </div>

                    {aiStatus.status === 'connected' && aiStatus.model && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <div className="text-emerald-400 text-sm">
                                Model: <span className="font-mono">{aiStatus.model}</span>
                            </div>
                        </div>
                    )}

                    {aiStatus.status === 'error' && aiStatus.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-red-400 text-sm">
                                Error: {aiStatus.error}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Document AI / Vision API */}
            <Card className="border-border/70 bg-card/70">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <span>👁️</span>
                        Document AI (Google Vision)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        OCR untuk mengekstrak teks dari PDF hasil scan/gambar
                    </p>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={testVisionAPI}
                            disabled={visionStatus.status === 'loading'}
                            className=""
                        >
                            {visionStatus.status === 'loading' ? '⏳ Testing...' : '👁️ Test Vision API'}
                        </Button>

                        {visionStatus.status === 'connected' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                                ✓ Terhubung
                            </Badge>
                        )}
                        {visionStatus.status === 'error' && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">
                                ✗ Error
                            </Badge>
                        )}
                    </div>

                    {visionStatus.message && visionStatus.status !== 'idle' && (
                        <div className={`p-3 rounded-lg text-sm ${visionStatus.status === 'connected'
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                            }`}>
                            {visionStatus.message}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Database Connection */}
            <Card className="border-border/70 bg-card/70">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <span>🗄️</span>
                        Database PostgreSQL
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={checkDatabase}
                            disabled={dbStatus.status === 'loading'}
                            variant="outline"
                            className="border-border/70"
                        >
                            {dbStatus.status === 'loading' ? '⏳ Checking...' : '🔄 Refresh Status'}
                        </Button>

                        {dbStatus.status === 'connected' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                                ✓ Terhubung
                            </Badge>
                        )}
                        {dbStatus.status === 'error' && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">
                                ✗ Error
                            </Badge>
                        )}
                    </div>

                    {dbStatus.status === 'connected' && dbStatus.stats && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg border border-border/50 bg-background/60 p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{dbStatus.stats.regulations}</div>
                                <div className="text-sm text-muted-foreground">Peraturan</div>
                            </div>
                            <div className="rounded-lg border border-border/50 bg-background/60 p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{dbStatus.stats.versions}</div>
                                <div className="text-sm text-muted-foreground">Versi</div>
                            </div>
                            <div className="rounded-lg border border-border/50 bg-background/60 p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{dbStatus.stats.articles}</div>
                                <div className="text-sm text-muted-foreground">Pasal</div>
                            </div>
                        </div>
                    )}

                    {dbStatus.status === 'error' && dbStatus.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-red-400 text-sm">
                                Error: {dbStatus.error}
                            </div>
                        </div>
                    )}

                    {/* Seed Data */}
                    <div className="border-t border-border/60 pt-4">
                        <h4 className="mb-2 font-medium text-foreground">🌱 Data Awal</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Load contoh data peraturan (Perpres Jaminan Kesehatan) untuk testing
                        </p>
                        <Button
                            onClick={seedDatabase}
                            disabled={seeding || dbStatus.status !== 'connected'}
                            variant="outline"
                            className="border-border/70"
                        >
                            {seeding ? '⏳ Loading...' : '🌱 Seed Sample Data'}
                        </Button>

                        {seedMessage && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${seedMessage.startsWith('✅')
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                }`}>
                                {seedMessage}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Environment Info */}
            <Card className="border-border/70 bg-card/70">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <span>📋</span>
                        Informasi Environment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between rounded border border-border/50 bg-background/60 p-2">
                            <span className="text-muted-foreground">Node Environment</span>
                            <span className="text-foreground">{process.env.NODE_ENV || 'development'}</span>
                        </div>
                        <div className="flex justify-between rounded border border-border/50 bg-background/60 p-2">
                            <span className="text-muted-foreground">Database</span>
                            <span className="text-foreground">PostgreSQL (port 5433)</span>
                        </div>
                        <div className="flex justify-between rounded border border-border/50 bg-background/60 p-2">
                            <span className="text-muted-foreground">ORM</span>
                            <span className="text-foreground">Prisma 7</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
