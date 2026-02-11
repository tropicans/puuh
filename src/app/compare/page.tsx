'use client';

import { useState, useEffect } from 'react';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { MatrixComparisonView } from '@/components/comparison/MatrixComparisonView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Article {
    id: string;
    articleNumber: string;
    content: string;
    status: string;
}

interface Version {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    status: string;
    articles: Article[];
}

interface Regulation {
    id: string;
    title: string;
    type: { shortName: string; name: string };
    versions: Version[];
}

type ViewMode = 'cards' | 'matrix';

export default function ComparePage() {
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegulation, setSelectedRegulation] = useState<string>('');
    const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('matrix'); // Default to matrix

    useEffect(() => {
        async function fetchRegulations() {
            try {
                const res = await fetch('/api/regulations');
                const data = await res.json();
                setRegulations(data.regulations || []);
            } catch (e) {
                console.error('Failed to fetch regulations:', e);
            }
            setLoading(false);
        }
        fetchRegulations();
    }, []);

    const regulationsWithMultipleVersions = regulations.filter(r => r.versions.length >= 2);

    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [comparisonData, setComparisonData] = useState<Regulation | null>(null);

    const handleQuickCompare = async (regId: string, v1Id: string, v2Id: string) => {
        setSelectedRegulation(regId);
        setSelectedVersions([v1Id, v2Id]);
        setComparisonLoading(true);

        try {
            const res = await fetch(`/api/regulations/${regId}`);
            const data = await res.json();
            if (data.regulation) {
                setComparisonData(data.regulation);
            }
        } catch (e) {
            console.error('Failed to fetch comparison data:', e);
        }
        setComparisonLoading(false);
    };

    // For Matrix view - just select regulation without specific versions
    const handleSelectForMatrix = async (regId: string) => {
        setSelectedRegulation(regId);
        setSelectedVersions(null);
        setComparisonLoading(true);

        try {
            const res = await fetch(`/api/regulations/${regId}`);
            const data = await res.json();
            if (data.regulation) {
                setComparisonData(data.regulation);
            }
        } catch (e) {
            console.error('Failed to fetch comparison data:', e);
        }
        setComparisonLoading(false);
    };

    const selectedV1 = comparisonData?.versions.find(v => v.id === selectedVersions?.[0]);
    const selectedV2 = comparisonData?.versions.find(v => v.id === selectedVersions?.[1]);

    const transformVersion = (v: Version | undefined) => {
        if (!v) return null;
        return {
            id: v.id,
            number: v.number,
            year: v.year,
            fullTitle: v.fullTitle,
            status: v.status as 'ACTIVE' | 'AMENDED' | 'REVOKED',
            articles: (v.articles || []).map(a => ({
                id: a.id,
                number: a.articleNumber,
                content: a.content,
                status: a.status as 'ACTIVE' | 'MODIFIED' | 'DELETED' | 'NEW'
            }))
        };
    };

    const transformVersionsForMatrix = () => {
        if (!comparisonData) return [];
        return comparisonData.versions.map(v => ({
            id: v.id,
            number: v.number,
            year: v.year,
            fullTitle: v.fullTitle,
            status: v.status,
            articles: (v.articles || []).map(a => ({
                id: a.id,
                number: a.articleNumber,
                content: a.content,
                status: a.status
            }))
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <Link href="/dashboard" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">← Kembali ke Dashboard</Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-foreground">Perbandingan Peraturan</h1>
                        <p className="text-muted-foreground">
                            Bandingkan versi peraturan untuk melihat perubahan
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex overflow-hidden rounded-lg border border-border/70 bg-card">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'matrix'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            📊 Matriks
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            🃏 Kartu
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse border-border/70 bg-card/70">
                            <CardHeader className="pb-2">
                                <div className="h-5 w-3/4 rounded bg-muted" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-4 w-1/2 rounded bg-muted" />
                                <div className="flex gap-2">
                                    <div className="h-8 w-24 rounded bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* No data state */}
            {!loading && regulationsWithMultipleVersions.length === 0 && (
                <Card className="border-border/70 bg-card/70">
                    <CardContent className="py-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                            Belum Ada Peraturan untuk Dibandingkan
                        </h3>
                        <p className="mx-auto mb-4 max-w-md text-muted-foreground">
                            Untuk membandingkan, upload minimal 2 versi dari regulasi yang sama.
                        </p>
                        <Link href="/upload">
                            <Button>
                                + Upload Peraturan
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Regulation selector cards */}
            {!loading && regulationsWithMultipleVersions.length > 0 && !comparisonData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {regulationsWithMultipleVersions.map(reg => {
                        const versions = reg.versions.sort((a, b) => a.year - b.year);
                        return (
                            <Card
                                key={reg.id}
                                className={`cursor-pointer border-border/70 bg-card/70 transition-all hover:border-primary/50 ${selectedRegulation === reg.id ? 'ring-2 ring-primary/50' : ''
                                    }`}
                                onClick={() => viewMode === 'matrix' ? handleSelectForMatrix(reg.id) : undefined}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-primary/40 text-primary">
                                            {reg.type.shortName}
                                        </Badge>
                                        <CardTitle className="truncate text-base text-foreground">
                                            {reg.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        📄 {versions.length} versi tersedia ({versions.map(v => v.year).join(', ')})
                                    </p>

                                    {viewMode === 'cards' && (
                                        <div className="flex flex-wrap gap-2">
                                            {versions.slice(0, -1).map((v, i) => {
                                                const nextV = versions[i + 1];
                                                return (
                                                    <Button
                                                        key={v.id}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-border/70 text-xs hover:bg-accent"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleQuickCompare(reg.id, v.id, nextV.id);
                                                        }}
                                                    >
                                                        {v.year} → {nextV.year}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {viewMode === 'matrix' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-primary/40 text-primary hover:bg-primary/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectForMatrix(reg.id);
                                            }}
                                        >
                                            📊 Lihat Matriks Perbandingan
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Comparison Loading */}
            {comparisonLoading && (
                <Card className="border-border/70 bg-card/70">
                    <CardContent className="py-12 text-center">
                        <div className="animate-spin text-4xl mb-3">⏳</div>
                        <p className="text-muted-foreground">Memuat data perbandingan...</p>
                    </CardContent>
                </Card>
            )}

            {/* Comparison result */}
            {!comparisonLoading && comparisonData && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-foreground">
                            {comparisonData.type.shortName} {comparisonData.title}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                setSelectedRegulation('');
                                setSelectedVersions(null);
                                setComparisonData(null);
                            }}
                        >
                            ✕ Tutup
                        </Button>
                    </div>

                    {viewMode === 'matrix' ? (
                        <MatrixComparisonView
                            versions={transformVersionsForMatrix()}
                            regulationTitle={`${comparisonData.type.shortName} ${comparisonData.title}`}
                        />
                    ) : selectedV1 && selectedV2 ? (
                        <ComparisonView
                            oldVersion={transformVersion(selectedV1)!}
                            newVersion={transformVersion(selectedV2)!}
                        />
                    ) : (
                        <Card className="border-dashed border-border/70 bg-card/40">
                            <CardContent className="py-10 text-center">
                                <div className="text-4xl mb-3">👆</div>
                                <h3 className="mb-1 text-lg font-medium text-foreground">
                                    Pilih Versi untuk Dibandingkan
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Klik tombol perbandingan di atas
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
