'use client';

import { useState, useEffect } from 'react';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { MatrixComparisonView } from '@/components/comparison/MatrixComparisonView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
                <a href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">← Kembali ke Beranda</a>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            ⚖️ Perbandingan Peraturan
                        </h1>
                        <p className="text-gray-400">
                            Bandingkan versi peraturan untuk melihat perubahan
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-700">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'matrix'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            📊 Matriks
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'cards'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
                        <Card key={i} className="bg-gray-900/50 border-gray-800 animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 bg-gray-700 rounded w-24"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* No data state */}
            {!loading && regulationsWithMultipleVersions.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardContent className="py-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Belum Ada Peraturan untuk Dibandingkan
                        </h3>
                        <p className="text-gray-400 max-w-md mx-auto mb-4">
                            Untuk membandingkan, upload minimal 2 versi dari regulasi yang sama.
                        </p>
                        <a href="/upload">
                            <Button className="bg-indigo-600 hover:bg-indigo-500">
                                + Upload Peraturan
                            </Button>
                        </a>
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
                                className={`bg-gray-900/50 border-gray-800 transition-all cursor-pointer hover:border-indigo-500/50 ${selectedRegulation === reg.id ? 'ring-2 ring-indigo-500' : ''
                                    }`}
                                onClick={() => viewMode === 'matrix' ? handleSelectForMatrix(reg.id) : undefined}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                                            {reg.type.shortName}
                                        </Badge>
                                        <CardTitle className="text-base text-white truncate">
                                            {reg.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-gray-400">
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
                                                        className="border-gray-700 text-xs hover:bg-gray-800"
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
                                            className="border-indigo-500/50 text-indigo-400 w-full hover:bg-indigo-900/30"
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
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardContent className="py-12 text-center">
                        <div className="animate-spin text-4xl mb-3">⏳</div>
                        <p className="text-gray-400">Memuat data perbandingan...</p>
                    </CardContent>
                </Card>
            )}

            {/* Comparison result */}
            {!comparisonLoading && comparisonData && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-300">
                            {comparisonData.type.shortName} {comparisonData.title}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
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
                        <Card className="bg-gray-900/30 border-gray-800 border-dashed">
                            <CardContent className="py-10 text-center">
                                <div className="text-4xl mb-3">👆</div>
                                <h3 className="text-lg font-medium text-white mb-1">
                                    Pilih Versi untuk Dibandingkan
                                </h3>
                                <p className="text-gray-500 text-sm">
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
