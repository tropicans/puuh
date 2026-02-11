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

    if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
    if (!version) return <div className="py-20 text-center text-red-400">Versi tidak ditemukan</div>;

    return (
        <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.push('/manage')}
                    className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Kembali ke Manage
                </button>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                        {version.regulation.type.shortName}
                    </Badge>
                    <h1 className="text-2xl font-bold text-foreground">
                        Edit Pasal: {version.regulation.title}
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Versi: Nomor {version.number} Tahun {version.year} • {version.articles.length} Pasal
                </p>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 rounded px-4 py-2 shadow-lg ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* List */}
            <div className="grid gap-4">
                {version.articles.map((article) => (
                    <Card key={article.id} className="border-border/70 bg-card/60 transition-colors hover:border-border">
                        <CardContent className="p-4">
                            {editingArticle?.id === article.id ? (
                                <div className="space-y-3">
                                    <div className="flex gap-4">
                                        <div className="w-1/4">
                                            <label className="mb-1 block text-xs text-muted-foreground">Nomor Pasal</label>
                                            <input
                                                value={editForm.articleNumber}
                                                onChange={(e) => setEditForm({ ...editForm, articleNumber: e.target.value })}
                                                className="w-full rounded border border-border/70 bg-background p-2 text-foreground"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-muted-foreground">Isi Pasal</label>
                                        <textarea
                                            value={editForm.content}
                                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                            rows={10}
                                            className="w-full rounded border border-border/70 bg-background p-2 font-mono text-sm leading-relaxed text-foreground"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button onClick={() => setEditingArticle(null)} variant="ghost" size="sm">
                                            Batal
                                        </Button>
                                        <Button onClick={handleSave} size="sm">
                                            Simpan Perubahan
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-primary">
                                            {article.articleNumber}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(article)}
                                                className="text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="text-sm text-red-300/70 hover:text-red-400"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
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
