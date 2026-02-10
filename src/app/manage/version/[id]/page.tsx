'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Article {
    id: string;
    articleNumber: string;
    content: string;
    orderIndex: number;
}

interface Version {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    articles: Article[];
    regulation: {
        title: string;
        type: { shortName: string };
    };
}

export default function EditArticlesPage() {
    const params = useParams();
    const router = useRouter();
    const versionId = params.id as string;

    const [version, setVersion] = useState<Version | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [editForm, setEditForm] = useState({ articleNumber: '', content: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadVersion = useCallback(async (): Promise<Version | null> => {
        const res = await fetch(`/api/versions/${versionId}`);
        const data = await res.json();
        return data.success ? data.version : null;
    }, [versionId]);

    useEffect(() => {
        async function initialFetch() {
            try {
                const data = await loadVersion();
                setVersion(data);
            } catch (error) {
                console.error('Failed to fetch:', error);
            }
            setLoading(false);
        }

        initialFetch();
    }, [loadVersion]);

    const handleEditClick = (article: Article) => {
        setEditingArticle(article);
        setEditForm({
            articleNumber: article.articleNumber,
            content: article.content
        });
    };

    const handleSave = async () => {
        if (!editingArticle) return;

        try {
            const res = await fetch(`/api/articles/${editingArticle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Pasal berhasil diupdate!' });
                setEditingArticle(null);
                const updatedVersion = await loadVersion();
                setVersion(updatedVersion);
            } else {
                setMessage({ type: 'error', text: 'Gagal update pasal' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleDelete = async (articleId: string) => {
        if (!confirm('Yakin hapus pasal ini?')) return;

        try {
            const res = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Pasal dihapus' });
                const updatedVersion = await loadVersion();
                setVersion(updatedVersion);
            }
        } catch {
            setMessage({ type: 'error', text: 'Gagal hapus' });
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
    if (!version) return <div className="text-center py-20 text-red-400">Versi tidak ditemukan</div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.push('/manage')}
                    className="text-gray-400 hover:text-white text-sm mb-4 inline-block"
                >
                    ← Kembali ke Manage
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-indigo-400 border-indigo-400/30">
                        {version.regulation.type.shortName}
                    </Badge>
                    <h1 className="text-2xl font-bold text-white">
                        Edit Pasal: {version.regulation.title}
                    </h1>
                </div>
                <p className="text-gray-400">
                    Versi: Nomor {version.number} Tahun {version.year} • {version.articles.length} Pasal
                </p>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* List */}
            <div className="grid gap-4">
                {version.articles.map((article) => (
                    <Card key={article.id} className="bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-colors">
                        <CardContent className="p-4">
                            {editingArticle?.id === article.id ? (
                                <div className="space-y-3">
                                    <div className="flex gap-4">
                                        <div className="w-1/4">
                                            <label className="text-xs text-gray-500 block mb-1">Nomor Pasal</label>
                                            <input
                                                value={editForm.articleNumber}
                                                onChange={(e) => setEditForm({ ...editForm, articleNumber: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Isi Pasal</label>
                                        <textarea
                                            value={editForm.content}
                                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                            rows={10}
                                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white font-mono text-sm leading-relaxed"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button onClick={() => setEditingArticle(null)} variant="ghost" size="sm">
                                            Batal
                                        </Button>
                                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500" size="sm">
                                            Simpan Perubahan
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-indigo-300">
                                            {article.articleNumber}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(article)}
                                                className="text-gray-400 hover:text-white text-sm"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="text-red-900/50 hover:text-red-400 text-sm"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                                        {article.content}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
