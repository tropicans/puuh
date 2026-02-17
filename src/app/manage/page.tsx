'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Version {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    status: string;
    _count?: { articles: number };
}

interface Regulation {
    id: string;
    title: string;
    description: string | null;
    type: { id: string; name: string; shortName: string };
    versions: Version[];
}

export default function ManagePage() {
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVersion, setEditingVersion] = useState<Version | null>(null);
    const [editForm, setEditForm] = useState({ number: '', year: '', fullTitle: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const loadRegulations = async (): Promise<Regulation[]> => {
        const res = await fetch('/api/regulations');
        const data = await res.json();
        return data.regulations || [];
    };

    useEffect(() => {
        async function initialFetch() {
            try {
                const items = await loadRegulations();
                setRegulations(items);
            } catch (error) {
                console.error('Failed to fetch:', error);
            }
            setLoading(false);
        }

        initialFetch();
    }, []);

    const handleEditVersion = (version: Version) => {
        setEditingVersion(version);
        setEditForm({
            number: version.number,
            year: version.year.toString(),
            fullTitle: version.fullTitle
        });
    };

    const handleSaveVersion = async () => {
        if (!editingVersion) return;

        try {
            const res = await fetch(`/api/versions/${editingVersion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Versi berhasil diupdate!' });
                setEditingVersion(null);
                const items = await loadRegulations();
                setRegulations(items);
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal update' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteVersion = async (versionId: string) => {
        if (!confirm('Yakin hapus versi ini? Semua pasal akan ikut terhapus.')) return;

        try {
            const res = await fetch(`/api/versions/${versionId}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Versi berhasil dihapus!' });
                const items = await loadRegulations();
                setRegulations(items);
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal hapus' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteRegulation = async (regId: string) => {
        if (!confirm('Yakin hapus peraturan ini? SEMUA versi akan ikut terhapus.')) return;

        try {
            const res = await fetch(`/api/regulations/${regId}/manage`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Peraturan berhasil dihapus!' });
                const items = await loadRegulations();
                setRegulations(items);
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal hapus' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleReparse = async (versionId: string) => {
        if (!confirm('Re-parse akan menghapus pasal lama dan mengekstrak ulang. Lanjutkan?')) return;

        setMessage({ type: 'success', text: 'Sedang parsing dengan AI...' });

        try {
            const res = await fetch(`/api/versions/${versionId}/reparse`, {
                method: 'POST'
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                const items = await loadRegulations();
                setRegulations(items);
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal re-parse' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        }

        setTimeout(() => setMessage(null), 5000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'AMENDED': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'REVOKED': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
            <div>
                <Link href="/dashboard" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="mb-2 text-3xl font-bold text-foreground">Kelola Peraturan</h1>
                <p className="text-muted-foreground">
                    Edit metadata, hapus, atau parse ulang peraturan dan versi dokumen
                </p>
            </div>

            {/* Message toast */}
            {message && (
                <div className={`rounded-lg p-4 ${message.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Edit Modal */}
            {editingVersion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <Card className="w-full max-w-lg border-border/70 bg-card">
                        <CardHeader>
                            <CardTitle className="text-foreground">Edit Versi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Nomor</label>
                                <input
                                    type="text"
                                    value={editForm.number}
                                    onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Tahun</label>
                                <input
                                    type="number"
                                    value={editForm.year}
                                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Judul Lengkap</label>
                                <input
                                    type="text"
                                    value={editForm.fullTitle}
                                    onChange={(e) => setEditForm({ ...editForm, fullTitle: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSaveVersion}
                                    className="flex-1"
                                >
                                    💾 Simpan
                                </Button>
                                <Button
                                    onClick={() => setEditingVersion(null)}
                                    variant="outline"
                                    className="flex-1 border-border/70"
                                >
                                    Batal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Regulations List */}
            {regulations.length === 0 ? (
                <Card className="border-border/70 bg-card/70">
                    <CardContent className="py-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="mb-2 text-lg font-semibold text-foreground">Belum Ada Peraturan</h3>
                        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                            Mulai dengan mengunggah peraturan pertama. Setelah diunggah, Anda bisa mengedit metadata, menghapus, atau parse ulang pasal di sini.
                        </p>
                        <Link href="/upload">
                            <Button>+ Unggah Peraturan Pertama</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {regulations.map(reg => (
                        <Card key={reg.id} className="border-border/70 bg-card/70">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-primary/40 text-primary">
                                        {reg.type.shortName}
                                    </Badge>
                                    <CardTitle className="text-lg text-foreground">{reg.title}</CardTitle>
                                    {reg.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{reg.description}</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleDeleteRegulation(reg.id)}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                >
                                    🗑️ Hapus Semua
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <h4 className="mb-3 text-sm font-medium text-foreground">Versi:</h4>
                                <div className="space-y-2">
                                    {reg.versions.map(version => (
                                        <div
                                            key={version.id}
                                            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${getStatusColor(version.status)} border text-xs`}>
                                                    {version.status}
                                                </Badge>
                                                <span className="text-white">
                                                    No. {version.number} Tahun {version.year}
                                                </span>
                                                {version._count?.articles !== undefined && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({version._count.articles} pasal)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReparse(version.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-primary/40 text-primary hover:bg-primary/10"
                                                >
                                                    🔄 Parse
                                                </Button>
                                                <Button
                                                    onClick={() => window.location.href = `/manage/version/${version.id}`}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-primary/40 text-primary hover:bg-primary/10"
                                                >
                                                    📝 Edit Pasal
                                                </Button>
                                                <Button
                                                    onClick={() => handleEditVersion(version)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-border/70 text-foreground"
                                                >
                                                    ⚙️ Meta
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteVersion(version.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
