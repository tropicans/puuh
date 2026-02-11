'use client';

import { useState, useEffect } from 'react';
import { VersionTimeline } from '@/components/regulations/VersionTimeline';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
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
    articles: Article[];
}

interface Regulation {
    id: string;
    title: string;
    type: string;
    description: string;
    versions: RegulationVersion[];
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
                        articles: v.articles.map((a) => ({
                            id: a.id,
                            number: a.articleNumber,
                            content: a.content,
                            status: a.status.toLowerCase() as 'active' | 'modified' | 'deleted' | 'new'
                        }))
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
                    <Button variant="outline" className="border-border/70">
                        📤 Export
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
                </TabsList>

                <TabsContent value="compare" className="space-y-6">
                    {canCompare ? (
                        <ComparisonView
                            oldVersion={selectedVersionObjects[0]!}
                            newVersion={selectedVersionObjects[1]!}
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
                                <div
                                    key={article.id}
                                    className="p-4 bg-background/60 rounded-lg border border-border/70"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-foreground">{article.number}</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                            ✓ Berlaku
                                        </Badge>
                                    </div>
                                    <div className="font-mono text-sm text-foreground whitespace-pre-wrap">
                                        {article.content}
                                    </div>
                                </div>
                            ))}

                            {(!latestVersion || latestVersion.articles.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada pasal yang tersedia
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
