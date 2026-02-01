'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    const [reuploadingVersion, setReuploadingVersion] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRegulations();
    }, []);

    const fetchRegulations = async () => {
        try {
            const res = await fetch('/api/regulations');
            const data = await res.json();
            setRegulations(data.regulations || []);
        } catch (error) {
            console.error('Failed to fetch:', error);
        }
        setLoading(false);
    };

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
                fetchRegulations();
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal update' });
            }
        } catch (error) {
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
                fetchRegulations();
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal hapus' });
            }
        } catch (error) {
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
                fetchRegulations();
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal hapus' });
            }
        } catch (error) {
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
                fetchRegulations();
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal re-parse' });
            }
        } catch (error) {
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
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div>
                <a href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← Kembali ke Dashboard
                </a>
                <h1 className="text-3xl font-bold text-white mb-2">🔧 Kelola Peraturan</h1>
                <p className="text-gray-400">
                    Edit, hapus, atau kelola peraturan dan versi
                </p>
            </div>

            {/* Message toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Edit Modal */}
            {editingVersion && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="bg-gray-900 border-gray-700 w-full max-w-lg">
                        <CardHeader>
                            <CardTitle className="text-white">Edit Versi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nomor</label>
                                <input
                                    type="text"
                                    value={editForm.number}
                                    onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tahun</label>
                                <input
                                    type="number"
                                    value={editForm.year}
                                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Judul Lengkap</label>
                                <input
                                    type="text"
                                    value={editForm.fullTitle}
                                    onChange={(e) => setEditForm({ ...editForm, fullTitle: e.target.value })}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSaveVersion}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                                >
                                    💾 Simpan
                                </Button>
                                <Button
                                    onClick={() => setEditingVersion(null)}
                                    variant="outline"
                                    className="flex-1 border-gray-700"
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
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardContent className="py-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-400">Belum ada peraturan</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {regulations.map(reg => (
                        <Card key={reg.id} className="bg-gray-900/50 border-gray-800">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 mb-2">
                                        {reg.type.shortName}
                                    </Badge>
                                    <CardTitle className="text-lg text-white">{reg.title}</CardTitle>
                                    {reg.description && (
                                        <p className="text-sm text-gray-400 mt-1">{reg.description}</p>
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
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Versi:</h4>
                                <div className="space-y-2">
                                    {reg.versions.map(version => (
                                        <div
                                            key={version.id}
                                            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${getStatusColor(version.status)} border text-xs`}>
                                                    {version.status}
                                                </Badge>
                                                <span className="text-white">
                                                    No. {version.number} Tahun {version.year}
                                                </span>
                                                {version._count?.articles !== undefined && (
                                                    <span className="text-xs text-gray-500">
                                                        ({version._count.articles} pasal)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReparse(version.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                                                >
                                                    🔄 Parse
                                                </Button>
                                                <Button
                                                    onClick={() => window.location.href = `/manage/version/${version.id}`}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                                                >
                                                    📝 Edit Pasal
                                                </Button>
                                                <Button
                                                    onClick={() => handleEditVersion(version)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-700 text-gray-300"
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
