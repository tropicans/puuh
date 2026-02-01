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
                    <p className="text-gray-400">Memuat data peraturan...</p>
                </div>
            </div>
        );
    }

    if (error || !regulation) {
        return (
            <div className="text-center py-20">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-white mb-2">Peraturan tidak ditemukan</h2>
                <p className="text-gray-400 mb-6">{error || `ID: ${id}`}</p>
                <a href="/" className="text-indigo-400 hover:text-indigo-300">
                    ← Kembali ke Dashboard
                </a>
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
            <a
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <span>←</span>
                <span>Kembali ke Dashboard</span>
            </a>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className="text-indigo-400 border-indigo-400/30" variant="outline">
                            {regulation.type}
                        </Badge>
                        <Badge className={`${getStatusColor(latestVersion?.status || 'active')} border`}>
                            {getStatusLabel(latestVersion?.status || 'active')}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        {regulation.title}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {regulation.description}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-700">
                        📤 Export
                    </Button>
                    <a href={`/upload?amends=${regulation.id}&title=${encodeURIComponent(regulation.title)}`}>
                        <Button className="bg-indigo-600 hover:bg-indigo-500">
                            + Tambah Versi
                        </Button>
                    </a>
                </div>
            </div>

            {/* Version Timeline */}
            <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
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
                <TabsList className="bg-gray-900 border border-gray-800">
                    <TabsTrigger value="compare" className="data-[state=active]:bg-indigo-600">
                        ⚖️ Perbandingan
                    </TabsTrigger>
                    <TabsTrigger value="versions" className="data-[state=active]:bg-indigo-600">
                        📋 Daftar Versi
                    </TabsTrigger>
                    <TabsTrigger value="consolidated" className="data-[state=active]:bg-indigo-600">
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
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardContent className="py-12 text-center">
                                <div className="text-5xl mb-4">⚖️</div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Pilih 2 Versi untuk Dibandingkan
                                </h3>
                                <p className="text-gray-400">
                                    Klik pada timeline di atas untuk memilih versi yang akan dibandingkan secara verbatim
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                    {regulation.versions.map(version => (
                        <Card key={version.id} className="bg-gray-900/50 border-gray-800">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-white">
                                        {version.fullTitle}
                                    </CardTitle>
                                    <Badge className={`${getStatusColor(version.status)} border`}>
                                        {getStatusLabel(version.status)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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
                                        <div className="flex items-center gap-1 text-indigo-400">
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
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <span>✅</span>
                                Pasal yang Masih Berlaku
                            </CardTitle>
                            <p className="text-sm text-gray-400">
                                Berdasarkan versi terbaru: {latestVersion?.fullTitle}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {latestVersion?.articles.map(article => (
                                <div
                                    key={article.id}
                                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-white">{article.number}</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                            ✓ Berlaku
                                        </Badge>
                                    </div>
                                    <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                        {article.content}
                                    </div>
                                </div>
                            ))}

                            {(!latestVersion || latestVersion.articles.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
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
