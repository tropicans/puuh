'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBanner } from '@/components/common/StatusBanner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useFlashMessage } from '@/hooks/useFlashMessage';

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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [editForm, setEditForm] = useState({ articleNumber: '', content: '' });
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [deleteTargetArticleId, setDeleteTargetArticleId] = useState<string | null>(null);
    const articleNumberInputRef = useRef<HTMLInputElement | null>(null);
    const { message, showMessage } = useFlashMessage();
    const mutationAction = useAsyncAction();

    const loadVersion = useCallback(async (): Promise<Version | null> => {
        const res = await fetch(`/api/versions/${versionId}`);
        if (!res.ok) {
            throw new Error('Gagal memuat data versi');
        }
        const data = await res.json();
        return data.success ? data.version : null;
    }, [versionId]);

    useEffect(() => {
        async function initialFetch() {
            try {
                const data = await loadVersion();
                setVersion(data);
                setLoadError(null);
            } catch (error) {
                console.error('Failed to fetch:', error);
                setLoadError(error instanceof Error ? error.message : 'Gagal memuat data');
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

    useEffect(() => {
        if (!editingArticle) return;
        const timer = window.setTimeout(() => {
            articleNumberInputRef.current?.focus();
            articleNumberInputRef.current?.select();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [editingArticle]);

    const handleSave = async () => {
        if (!editingArticle) return;
        setActionKey(`save:${editingArticle.id}`);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/articles/${editingArticle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            return res.json();
        });

        if (!data) {
            showMessage({ type: 'error', text: mutationAction.error || 'Terjadi kesalahan jaringan' });
            setActionKey(null);
            return;
        }

        if (data.success) {
            showMessage({ type: 'success', text: 'Pasal berhasil diupdate!' });
            setEditingArticle(null);
            const updatedVersion = await loadVersion();
            setVersion(updatedVersion);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal update pasal' });
        }
        setActionKey(null);
    };

    const handleDelete = async (articleId: string) => {
        setActionKey(`delete:${articleId}`);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE'
            });
            return res.json();
        });

        if (!data) {
            showMessage({ type: 'error', text: mutationAction.error || 'Terjadi kesalahan jaringan' });
            setActionKey(null);
            return;
        }

        if (data.success) {
            showMessage({ type: 'success', text: 'Pasal dihapus' });
            const updatedVersion = await loadVersion();
            setVersion(updatedVersion);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal hapus' });
        }
        setActionKey(null);
    };

    if (loading) return <div className="py-20 text-center text-muted-foreground">Memuat data versi...</div>;
    if (loadError) return <div className="py-20 text-center text-red-400">{loadError}</div>;
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
                <div className="fixed right-4 top-4 z-50 max-w-sm">
                    <StatusBanner tone={message.type === 'success' ? 'success' : 'error'} message={message.text} />
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
                                            <label htmlFor={`article-number-${article.id}`} className="mb-1 block text-xs text-muted-foreground">Nomor Pasal</label>
                                            <input
                                                ref={articleNumberInputRef}
                                                id={`article-number-${article.id}`}
                                                value={editForm.articleNumber}
                                                onChange={(e) => setEditForm({ ...editForm, articleNumber: e.target.value })}
                                                className="w-full rounded border border-border/70 bg-background p-2 text-foreground"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor={`article-content-${article.id}`} className="mb-1 block text-xs text-muted-foreground">Isi Pasal</label>
                                        <textarea
                                            id={`article-content-${article.id}`}
                                            value={editForm.content}
                                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                            rows={10}
                                            className="w-full rounded border border-border/70 bg-background p-2 font-mono text-sm leading-relaxed text-foreground"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button onClick={() => setEditingArticle(null)} variant="ghost" size="sm" type="button">
                                            Batal
                                        </Button>
                                        <Button onClick={handleSave} size="sm" type="button" disabled={actionKey === `save:${article.id}`}>
                                            {actionKey === `save:${article.id}` ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                                                type="button"
                                                onClick={() => handleEditClick(article)}
                                                className="text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTargetArticleId(article.id)}
                                                disabled={actionKey === `delete:${article.id}`}
                                                className="text-sm text-red-300/70 hover:text-red-400"
                                            >
                                                {actionKey === `delete:${article.id}` ? 'Menghapus...' : 'Hapus'}
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

            <ConfirmDialog
                open={!!deleteTargetArticleId}
                title="Hapus pasal ini?"
                description="Pasal yang dihapus tidak dapat dipulihkan otomatis."
                confirmLabel="Hapus Pasal"
                destructive
                loading={!!deleteTargetArticleId && actionKey === `delete:${deleteTargetArticleId}`}
                onConfirm={async () => {
                    if (!deleteTargetArticleId) return;
                    await handleDelete(deleteTargetArticleId);
                    setDeleteTargetArticleId(null);
                }}
                onClose={() => setDeleteTargetArticleId(null)}
            />
        </div>
    );
}
