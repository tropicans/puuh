'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBanner } from '@/components/common/StatusBanner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useFlashMessage } from '@/hooks/useFlashMessage';
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

type ConfirmAction =
    | { kind: 'delete-version'; versionId: string }
    | { kind: 'delete-regulation'; regId: string }
    | { kind: 'reparse-version'; versionId: string }
    | null;

export default function ManagePage() {
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [editingVersion, setEditingVersion] = useState<Version | null>(null);
    const [editForm, setEditForm] = useState({ number: '', year: '', fullTitle: '' });
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const editNumberInputRef = useRef<HTMLInputElement | null>(null);
    const { message, showMessage } = useFlashMessage();
    const mutationAction = useAsyncAction();

    const loadRegulations = async (): Promise<Regulation[]> => {
        const res = await fetch('/api/regulations');
        if (!res.ok) {
            throw new Error('Gagal memuat data peraturan');
        }
        const data = await res.json();
        return data.regulations || [];
    };

    useEffect(() => {
        async function initialFetch() {
            try {
                const items = await loadRegulations();
                setRegulations(items);
                setLoadError(null);
            } catch (error) {
                console.error('Failed to fetch:', error);
                setLoadError(error instanceof Error ? error.message : 'Gagal memuat data');
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

    useEffect(() => {
        if (!editingVersion) return;
        const timer = window.setTimeout(() => {
            editNumberInputRef.current?.focus();
            editNumberInputRef.current?.select();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [editingVersion]);

    useEffect(() => {
        if (!editingVersion) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setEditingVersion(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editingVersion]);

    const handleSaveVersion = async () => {
        if (!editingVersion) return;
        setActionKey(`save:${editingVersion.id}`);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/versions/${editingVersion.id}`, {
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
            showMessage({ type: 'success', text: 'Versi berhasil diupdate!' });
            setEditingVersion(null);
            const items = await loadRegulations();
            setRegulations(items);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal update' });
        }
        setActionKey(null);
    };

    const handleDeleteVersion = async (versionId: string) => {
        setActionKey(`delete-version:${versionId}`);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/versions/${versionId}`, {
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
            showMessage({ type: 'success', text: 'Versi berhasil dihapus!' });
            const items = await loadRegulations();
            setRegulations(items);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal hapus' });
        }
        setActionKey(null);
    };

    const handleDeleteRegulation = async (regId: string) => {
        setActionKey(`delete-regulation:${regId}`);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/regulations/${regId}/manage`, {
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
            showMessage({ type: 'success', text: 'Peraturan berhasil dihapus!' });
            const items = await loadRegulations();
            setRegulations(items);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal hapus' });
        }
        setActionKey(null);
    };

    const handleReparse = async (versionId: string) => {
        setActionKey(`reparse:${versionId}`);

        showMessage({ type: 'success', text: 'Sedang parsing dengan AI...' }, 5000);

        const data = await mutationAction.run(async () => {
            const res = await fetch(`/api/versions/${versionId}/reparse`, {
                method: 'POST'
            });
            return res.json();
        });

        if (!data) {
            showMessage({ type: 'error', text: mutationAction.error || 'Terjadi kesalahan jaringan' }, 5000);
            setActionKey(null);
            return;
        }

        if (data.success) {
            showMessage({ type: 'success', text: data.message }, 5000);
            const items = await loadRegulations();
            setRegulations(items);
        } else {
            showMessage({ type: 'error', text: data.error || 'Gagal re-parse' }, 5000);
        }
        setActionKey(null);
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
                <div className="text-muted-foreground">Memuat data kelola...</div>
            </div>
        );
    }

    const confirmDialogConfig = (() => {
        if (!confirmAction) return null;
        if (confirmAction.kind === 'delete-version') {
            return {
                title: 'Hapus versi ini?',
                description: 'Semua pasal pada versi ini akan ikut terhapus dan tindakan ini tidak dapat dibatalkan.',
                confirmLabel: 'Hapus Versi',
                destructive: true,
                onConfirm: () => handleDeleteVersion(confirmAction.versionId),
                loading: actionKey === `delete-version:${confirmAction.versionId}`,
            };
        }
        if (confirmAction.kind === 'delete-regulation') {
            return {
                title: 'Hapus seluruh peraturan?',
                description: 'Semua versi dan pasal pada peraturan ini akan ikut terhapus permanen.',
                confirmLabel: 'Hapus Peraturan',
                destructive: true,
                onConfirm: () => handleDeleteRegulation(confirmAction.regId),
                loading: actionKey === `delete-regulation:${confirmAction.regId}`,
            };
        }
        return {
            title: 'Re-parse versi ini?',
            description: 'Pasal lama akan diganti oleh hasil ekstraksi terbaru. Pastikan raw text sudah benar.',
            confirmLabel: 'Lanjut Re-parse',
            destructive: false,
            onConfirm: () => handleReparse(confirmAction.versionId),
            loading: actionKey === `reparse:${confirmAction.versionId}`,
        };
    })();

    return (
        <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
            <div>
                <Link href="/dashboard" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="mb-2 text-3xl font-bold text-foreground">Kelola Peraturan</h1>
                <p className="text-muted-foreground">
                    Edit, hapus, atau kelola peraturan dan versi
                </p>
            </div>

            {/* Message toast */}
            {message && (
                <StatusBanner tone={message.type === 'success' ? 'success' : 'error'} message={message.text} />
            )}

            {loadError && (
                <StatusBanner tone="error" message={loadError} />
            )}

            {/* Edit Modal */}
            {editingVersion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-version-title">
                    <Card className="w-full max-w-lg border-border/70 bg-card">
                        <CardHeader>
                            <CardTitle id="edit-version-title" className="text-foreground">Edit Versi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="edit-version-number" className="mb-1 block text-sm text-muted-foreground">Nomor</label>
                                <input
                                    id="edit-version-number"
                                    ref={editNumberInputRef}
                                    type="text"
                                    value={editForm.number}
                                    onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-version-year" className="mb-1 block text-sm text-muted-foreground">Tahun</label>
                                <input
                                    id="edit-version-year"
                                    type="number"
                                    value={editForm.year}
                                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-version-title-input" className="mb-1 block text-sm text-muted-foreground">Judul Lengkap</label>
                                <input
                                    id="edit-version-title-input"
                                    type="text"
                                    value={editForm.fullTitle}
                                    onChange={(e) => setEditForm({ ...editForm, fullTitle: e.target.value })}
                                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSaveVersion}
                                    disabled={actionKey === `save:${editingVersion.id}`}
                                    className="flex-1"
                                >
                                    {actionKey === `save:${editingVersion.id}` ? 'Menyimpan...' : 'Simpan'}
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
                        <p className="text-muted-foreground">Belum ada peraturan</p>
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
                                    onClick={() => setConfirmAction({ kind: 'delete-regulation', regId: reg.id })}
                                    variant="outline"
                                    size="sm"
                                    disabled={actionKey === `delete-regulation:${reg.id}`}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                >
                                    {actionKey === `delete-regulation:${reg.id}` ? 'Menghapus...' : 'Hapus Semua'}
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
                                                    onClick={() => setConfirmAction({ kind: 'reparse-version', versionId: version.id })}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={actionKey === `reparse:${version.id}`}
                                                    className="border-primary/40 text-primary hover:bg-primary/10"
                                                >
                                                    {actionKey === `reparse:${version.id}` ? 'Parsing...' : 'Parse Ulang'}
                                                </Button>
                                                <Button size="sm" variant="outline" asChild className="border-primary/40 text-primary hover:bg-primary/10">
                                                    <Link href={`/manage/version/${version.id}`}>Edit Pasal</Link>
                                                </Button>
                                                <Button
                                                    onClick={() => handleEditVersion(version)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-border/70 text-foreground"
                                                >
                                                    Edit Meta
                                                </Button>
                                                <Button
                                                    onClick={() => setConfirmAction({ kind: 'delete-version', versionId: version.id })}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={actionKey === `delete-version:${version.id}`}
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                >
                                                    {actionKey === `delete-version:${version.id}` ? 'Menghapus...' : 'Hapus'}
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

            {confirmDialogConfig && (
                <ConfirmDialog
                    open={!!confirmDialogConfig}
                    title={confirmDialogConfig.title}
                    description={confirmDialogConfig.description}
                    confirmLabel={confirmDialogConfig.confirmLabel}
                    destructive={confirmDialogConfig.destructive}
                    loading={confirmDialogConfig.loading}
                    onConfirm={async () => {
                        await confirmDialogConfig.onConfirm();
                        setConfirmAction(null);
                    }}
                    onClose={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
}
