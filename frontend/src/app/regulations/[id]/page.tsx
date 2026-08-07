'use client';

import { useState, useEffect, useRef } from 'react';
import { VersionTimeline } from '@/components/regulations/VersionTimeline';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import { isInvalidatingDisposition, normalizeArticleNumber } from '@/lib/judicial-review';
import { use } from 'react';
import Link from 'next/link';

interface Article {
    id: string;
    number: string;
    content: string;
    status: 'active' | 'modified' | 'deleted' | 'new';
}

interface RegulationVersion {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    status: 'active' | 'amended' | 'revoked';
    effectiveDate: string;
    pdfPath?: string;
    extractionMethod?: string | null;
    articles: Article[];
}

interface Regulation {
    id: string;
    title: string;
    type: string;
    description: string;
    versions: RegulationVersion[];
    judicialReviews: JudicialReviewCase[];
}

type JudicialDisposition = 'INVALIDATED' | 'UPHELD' | 'CONDITIONALLY_VALID' | 'CONDITIONALLY_INVALID' | 'NO_DIRECT_EFFECT';

interface JudicialReviewImpact {
    id: string;
    articleNumber: string;
    disposition: JudicialDisposition;
    amarExcerpt?: string | null;
}

interface JudicialReviewCase {
    id: string;
    forum: 'MK' | 'MA';
    decisionNumber: string;
    decisionDate?: string | null;
    outcome: 'GRANTED' | 'PARTIALLY_GRANTED' | 'REJECTED' | 'INADMISSIBLE' | 'WITHDRAWN' | 'OTHER';
    amarText: string;
    sourceUrl?: string | null;
    impacts: JudicialReviewImpact[];
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function RegulationDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [regulation, setRegulation] = useState<Regulation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
    const [syncingJudicial, setSyncingJudicial] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchRegulation = async () => {
            try {
                const response = await fetch(`/api/regulations/${id}`);
                if (!response.ok) {
                    throw new Error('Regulation not found');
                }
                const data = await response.json();

                // Transform database response to match component interface
                const reg = data.regulation;
                const transformed: Regulation = {
                    id: reg.id,
                    title: reg.title,
                    type: reg.type.shortName,
                    description: reg.description || '',
                    versions: reg.versions.map((v: {
                        id: string;
                        number: string;
                        year: number;
                        fullTitle: string;
                        status: string;
                        effectiveDate: string | null;
                        pdfPath: string | null;
                        extractionMethod: string | null;
                        articles: Array<{
                            id: string;
                            articleNumber: string;
                            content: string;
                            status: string;
                        }>;
                    }) => ({
                        id: v.id,
                        number: v.number,
                        year: v.year,
                        fullTitle: v.fullTitle,
                        status: v.status.toLowerCase() as 'active' | 'amended' | 'revoked',
                        effectiveDate: v.effectiveDate || '',
                        pdfPath: v.pdfPath || undefined,
                        extractionMethod: v.extractionMethod || null,
                        articles: v.articles.map((a) => ({
                            id: a.id,
                            number: a.articleNumber,
                            content: a.content,
                            status: a.status.toLowerCase() as 'active' | 'modified' | 'deleted' | 'new'
                        }))
                    })),
                    judicialReviews: (reg.judicialReviews || []).map((jr: {
                        id: string;
                        forum: 'MK' | 'MA';
                        decisionNumber: string;
                        decisionDate: string | null;
                        outcome: 'GRANTED' | 'PARTIALLY_GRANTED' | 'REJECTED' | 'INADMISSIBLE' | 'WITHDRAWN' | 'OTHER';
                        amarText: string;
                        sourceUrl: string | null;
                        impacts: Array<{
                            id: string;
                            articleNumber: string;
                            disposition: JudicialDisposition;
                            amarExcerpt: string | null;
                        }>;
                    }) => ({
                        id: jr.id,
                        forum: jr.forum,
                        decisionNumber: jr.decisionNumber,
                        decisionDate: jr.decisionDate,
                        outcome: jr.outcome,
                        amarText: jr.amarText,
                        sourceUrl: jr.sourceUrl,
                        impacts: jr.impacts
                    }))
                };

                setRegulation(transformed);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load regulation');
            } finally {
                setLoading(false);
            }
        };

        fetchRegulation();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <p className="text-muted-foreground">Memuat data peraturan...</p>
                </div>
            </div>
        );
    }

    if (error || !regulation) {
        return (
            <div className="text-center py-20">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Peraturan tidak ditemukan</h2>
                <p className="text-muted-foreground mb-6">{error || `ID: ${id}`}</p>
                <Link href="/dashboard" className="text-primary hover:text-primary/80">
                    ← Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    const handleVersionSelect = (versionId: string) => {
        setSelectedVersions(prev => {
            if (prev.includes(versionId)) {
                return prev.filter(v => v !== versionId);
            }
            if (prev.length >= 2) {
                return [prev[1], versionId];
            }
            return [...prev, versionId];
        });
    };

    const getSelectedVersionObjects = () => {
        const versions = selectedVersions
            .map(id => regulation.versions.find(v => v.id === id))
            .filter(Boolean) as RegulationVersion[];

        versions.sort((a, b) => (a?.year || 0) - (b?.year || 0));
        return versions;
    };

    const selectedVersionObjects = getSelectedVersionObjects();
    const canCompare = selectedVersionObjects.length === 2;

    const latestVersion = regulation.versions[regulation.versions.length - 1];

    const handleSyncJudicial = async () => {
        setSyncingJudicial(true);
        setSyncMessage('Memulai sinkronisasi...');
        try {
            const response = await fetch(`/api/regulations/${id}/judicial-reviews/sync`, {
                method: 'POST'
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                setSyncMessage(data.error || 'Gagal sinkronisasi putusan judicial review');
                setSyncingJudicial(false);
                return;
            }

            const { taskId } = data;
            setSyncMessage('Mengantre pemrosesan...');

            pollIntervalRef.current = setInterval(async () => {
                try {
                    const taskRes = await fetch(`/api/tasks/${taskId}`);
                    if (!taskRes.ok) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setSyncMessage('Gagal memantau status pemrosesan.');
                        setSyncingJudicial(false);
                        return;
                    }
                    const taskData = await taskRes.json();
                    if (!taskData.success || !taskData.task) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setSyncMessage(taskData.error || 'Tugas tidak ditemukan.');
                        setSyncingJudicial(false);
                        return;
                    }

                    const task = taskData.task;
                    if (task.status === 'PENDING') {
                        setSyncMessage('Tugas mengantre...');
                    } else if (task.status === 'PROCESSING') {
                        const progressStr = task.progress ? `[${task.progress}%] ` : '';
                        const stepMsg = task.result && typeof task.result === 'object' && 'message' in task.result
                            ? (task.result as any).message
                            : 'Memproses analisis...';
                        setSyncMessage(`${progressStr}${stepMsg}`);
                    } else if (task.status === 'SUCCESS') {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        const finalResult = task.result;
                        setSyncMessage(`Sinkronisasi berhasil: ${finalResult?.synced || 0} putusan diproses.`);
                        setSyncingJudicial(false);
                        // Reload window to show fresh synced data
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else if (task.status === 'FAILED') {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        setSyncMessage(`Gagal sinkronisasi: ${task.error || 'Terjadi kesalahan.'}`);
                        setSyncingJudicial(false);
                    }
                } catch (err) {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setSyncMessage(err instanceof Error ? err.message : 'Terjadi kesalahan.');
                    setSyncingJudicial(false);
                }
            }, 2000);

        } catch (syncError) {
            setSyncMessage(syncError instanceof Error ? syncError.message : 'Gagal sinkronisasi putusan judicial review');
            setSyncingJudicial(false);
        }
    };
    const allJudicialImpacts = regulation.judicialReviews.flatMap((review) =>
        review.impacts.map((impact) => ({
            ...impact,
            forum: review.forum,
            decisionNumber: review.decisionNumber,
            decisionDate: review.decisionDate,
            outcome: review.outcome
        }))
    );

    const impactsByArticle = allJudicialImpacts.reduce((acc, impact) => {
        const key = normalizeArticleNumber(impact.articleNumber);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(impact);
        return acc;
    }, {} as Record<string, Array<JudicialReviewImpact & { forum: 'MK' | 'MA'; decisionNumber: string; decisionDate?: string | null; outcome: string }>>);

    const comparisonJudicialMap = Object.entries(impactsByArticle).reduce((acc, [articleKey, impacts]) => {
        const prioritized = [...impacts].sort((a, b) => {
            const aPriority = isInvalidatingDisposition(a.disposition) ? 0 : 1;
            const bPriority = isInvalidatingDisposition(b.disposition) ? 0 : 1;
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            const aDate = a.decisionDate ? new Date(a.decisionDate).getTime() : 0;
            const bDate = b.decisionDate ? new Date(b.decisionDate).getTime() : 0;
            return bDate - aDate;
        })[0];

        if (prioritized) {
            acc[articleKey] = {
                forum: prioritized.forum,
                decisionNumber: prioritized.decisionNumber,
                disposition: prioritized.disposition,
                amarExcerpt: prioritized.amarExcerpt || undefined
            };
        }

        return acc;
    }, {} as Record<string, { forum: 'MK' | 'MA'; decisionNumber: string; disposition: JudicialDisposition; amarExcerpt?: string }>);

    const judicialOutcomeLabel: Record<JudicialReviewCase['outcome'], string> = {
        GRANTED: 'Dikabulkan',
        PARTIALLY_GRANTED: 'Dikabulkan Sebagian',
        REJECTED: 'Ditolak',
        INADMISSIBLE: 'Tidak Dapat Diterima',
        WITHDRAWN: 'Ditarik Kembali',
        OTHER: 'Lainnya'
    };

    const dispositionLabel: Record<JudicialDisposition, string> = {
        INVALIDATED: 'Dinyatakan Tidak Berlaku',
        UPHELD: 'Dipertahankan',
        CONDITIONALLY_VALID: 'Konstitusional Bersyarat',
        CONDITIONALLY_INVALID: 'Inkonstitusional Bersyarat',
        NO_DIRECT_EFFECT: 'Tidak Berdampak Langsung'
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back button */}
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <span>←</span>
                <span>Kembali ke Dashboard</span>
            </Link>

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <Badge className="text-primary border-primary/40" variant="outline">
                            {regulation.type}
                        </Badge>
                        <Badge className={`${getStatusColor(latestVersion?.status || 'active')} border`}>
                            {getStatusLabel(latestVersion?.status || 'active')}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {regulation.title}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {regulation.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="border-border/70" asChild>
                        <a href={`/api/export?regulationId=${regulation.id}`} target="_blank" rel="noopener noreferrer">
                            📤 Export
                        </a>
                    </Button>
                    <Link href={`/upload?amends=${regulation.id}&title=${encodeURIComponent(regulation.title)}`}>
                        <Button>
                            + Tambah Versi
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Version Timeline */}
            <Card className="bg-card/70 border-border/70">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <span>📅</span>
                        Timeline Versi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <VersionTimeline
                        regulation={regulation}
                        selectedVersions={selectedVersions}
                        onVersionSelect={handleVersionSelect}
                    />
                </CardContent>
            </Card>

            {/* Tabs: Comparison or Version Details */}
            <Tabs defaultValue="compare" className="space-y-6">
                <TabsList className="w-full justify-start overflow-x-auto border border-border/70 bg-card">
                    <TabsTrigger value="compare" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        ⚖️ Perbandingan
                    </TabsTrigger>
                    <TabsTrigger value="versions" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        📋 Daftar Versi
                    </TabsTrigger>
                    <TabsTrigger value="consolidated" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        ✅ Konsolidasi
                    </TabsTrigger>
                    <TabsTrigger value="judicial" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        ⚖️ Judicial Review
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="compare" className="space-y-6">
                    {canCompare ? (
                        <ComparisonView
                            oldVersion={selectedVersionObjects[0]!}
                            newVersion={selectedVersionObjects[1]!}
                            judicialImpacts={comparisonJudicialMap}
                        />
                    ) : (
                        <Card className="bg-card/70 border-border/70">
                            <CardContent className="py-12 text-center">
                                <div className="text-5xl mb-4">⚖️</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    Pilih 2 Versi untuk Dibandingkan
                                </h3>
                                <p className="text-muted-foreground">
                                    Klik pada timeline di atas untuk memilih versi yang akan dibandingkan secara verbatim
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                    {regulation.versions.map(version => (
                        <Card key={version.id} className="bg-card/70 border-border/70">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-foreground">
                                        {version.fullTitle}
                                    </CardTitle>
                                    <Badge className={`${getStatusColor(version.status)} border`}>
                                        {getStatusLabel(version.status)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <span>📝</span>
                                    <span>{version.articles.length} pasal</span>
                                </div>
                                    {version.effectiveDate && (
                                        <div className="flex items-center gap-1">
                                            <span>📅</span>
                                            <span>Berlaku: {formatDate(version.effectiveDate)}</span>
                                        </div>
                                    )}
                                    {version.pdfPath && (
                                        <div className="flex items-center gap-1 text-primary">
                                            <span>📄</span>
                                            <span>PDF tersedia</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                    <TabsContent value="consolidated" className="space-y-4">
                    <Card className="bg-card/70 border-border/70">
                        <CardHeader>
                            <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                <span>✅</span>
                                Pasal yang Masih Berlaku
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Berdasarkan versi terbaru: {latestVersion?.fullTitle}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {latestVersion?.articles.map(article => (
                                (() => {
                                    const articleImpacts = impactsByArticle[normalizeArticleNumber(article.number)] || [];
                                    const isInvalidatedByJudicialReview = articleImpacts.some((impact) => isInvalidatingDisposition(impact.disposition));

                                    return (
                                <div
                                    key={article.id}
                                    className="p-4 bg-background/60 rounded-lg border border-border/70"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-foreground">{article.number}</span>
                                        {isInvalidatedByJudicialReview ? (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs">
                                                ⚖️ Tidak Berlaku (JR)
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                                ✓ Berlaku
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="font-mono text-sm text-foreground whitespace-pre-wrap">
                                        {article.content}
                                    </div>
                                    {articleImpacts.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {articleImpacts.map((impact, idx) => (
                                                <div key={`${impact.decisionNumber}-${idx}`} className="rounded-md border border-border/60 bg-card/40 p-2 text-xs text-muted-foreground">
                                                    <span className="font-medium text-foreground">{impact.forum} {impact.decisionNumber}</span>
                                                    <span className="mx-1">•</span>
                                                    <span>{dispositionLabel[impact.disposition]}</span>
                                                    {impact.decisionDate && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <span>{formatDate(impact.decisionDate)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                    );
                                })()
                            ))}

                            {(!latestVersion || latestVersion.articles.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada pasal yang tersedia
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="judicial" className="space-y-4">
                    <Card className="bg-card/70 border-border/70">
                        <CardHeader>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                    <span>⚖️</span>
                                    Judicial Review (MK/MA)
                                </CardTitle>
                                <Button type="button" variant="outline" onClick={handleSyncJudicial} disabled={syncingJudicial}>
                                    {syncingJudicial ? 'Sinkronisasi...' : 'Sinkronkan MK/MA'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {syncMessage && (
                                <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
                                    {syncMessage}
                                </div>
                            )}
                            {regulation.judicialReviews.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Belum ada data judicial review untuk regulasi ini.
                                </div>
                            ) : (
                                regulation.judicialReviews.map((review) => (
                                    <div key={review.id} className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="border-primary/40 text-primary">
                                                {review.forum}
                                            </Badge>
                                            <span className="font-semibold text-foreground">Putusan {review.decisionNumber}</span>
                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border">
                                                {judicialOutcomeLabel[review.outcome]}
                                            </Badge>
                                            {review.decisionDate && (
                                                <span className="text-xs text-muted-foreground">{formatDate(review.decisionDate)}</span>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground line-clamp-4">
                                            {review.amarText}
                                        </div>

                                        {review.sourceUrl && (
                                            <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                                                {review.sourceUrl}
                                            </a>
                                        )}

                                        {review.impacts.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-foreground">Pasal Terdampak</div>
                                                {review.impacts.map((impact) => (
                                                    <div key={impact.id} className="rounded-md border border-border/60 bg-card/40 p-2 text-xs text-muted-foreground">
                                                        <span className="font-medium text-foreground">{impact.articleNumber}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>{dispositionLabel[impact.disposition]}</span>
                                                        {impact.amarExcerpt && (
                                                            <div className="mt-1 line-clamp-3">{impact.amarExcerpt}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
