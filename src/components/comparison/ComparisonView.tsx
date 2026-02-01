'use client';

import { ArticleDiff, NewArticleText, DeletedArticleText } from './ArticleDiff';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { useState } from 'react';

// Local interface definitions (matching API response structure)
interface Article {
    id: string;
    number: string;
    content: string;
    status: string;
}

interface RegulationVersion {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    status: string;
    articles: Article[];
}

interface ComparisonViewProps {
    oldVersion: RegulationVersion;
    newVersion: RegulationVersion;
}

type FilterType = 'all' | 'modified' | 'deleted' | 'new' | 'active';

export function ComparisonView({ oldVersion, newVersion }: ComparisonViewProps) {
    const [filter, setFilter] = useState<FilterType>('modified'); // Default to show changes
    const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline');
    const [expandAll, setExpandAll] = useState(true);

    // Gabungkan semua pasal dari kedua versi
    const allArticleNumbers = new Set<string>();
    oldVersion.articles.forEach(a => allArticleNumbers.add(a.number));
    newVersion.articles.forEach(a => allArticleNumbers.add(a.number));

    // Buat mapping untuk lookup cepat
    const oldArticlesMap = new Map(oldVersion.articles.map(a => [a.number, a]));
    const newArticlesMap = new Map(newVersion.articles.map(a => [a.number, a]));

    // Gabungkan dan tentukan status
    const comparedArticles = Array.from(allArticleNumbers).map(number => {
        const oldArticle = oldArticlesMap.get(number);
        const newArticle = newArticlesMap.get(number);

        let status: 'active' | 'modified' | 'deleted' | 'new';

        if (!oldArticle && newArticle) {
            status = 'new';
        } else if (oldArticle && !newArticle) {
            status = 'deleted';
        } else if (oldArticle && newArticle) {
            status = oldArticle.content === newArticle.content ? 'active' : 'modified';
        } else {
            status = 'active';
        }

        return {
            number,
            oldArticle,
            newArticle,
            status
        };
    });

    // Sort berdasarkan nomor pasal
    comparedArticles.sort((a, b) => {
        const numA = parseInt(a.number.replace(/\D/g, '') || '0');
        const numB = parseInt(b.number.replace(/\D/g, '') || '0');
        return numA - numB;
    });

    // Filter berdasarkan status
    const filteredArticles = filter === 'all'
        ? comparedArticles
        : comparedArticles.filter(a => a.status === filter);

    // Stats
    const stats = {
        all: comparedArticles.length,
        active: comparedArticles.filter(a => a.status === 'active').length,
        modified: comparedArticles.filter(a => a.status === 'modified').length,
        deleted: comparedArticles.filter(a => a.status === 'deleted').length,
        new: comparedArticles.filter(a => a.status === 'new').length,
    };

    const changesCount = stats.modified + stats.deleted + stats.new;

    return (
        <div className="space-y-6">
            {/* Summary Header */}
            <Card className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-500/30">
                <CardContent className="py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                📊 Ringkasan Perubahan
                            </h2>
                            <p className="text-indigo-200 mt-1">
                                <span className="font-medium">{oldVersion.number}/{oldVersion.year}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">{newVersion.number}/{newVersion.year}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.all}</div>
                                <div className="text-xs text-indigo-300">Total Pasal</div>
                            </div>
                            <div className="h-10 w-px bg-indigo-500/30"></div>
                            <div>
                                <div className="text-3xl font-bold text-amber-400">{changesCount}</div>
                                <div className="text-xs text-indigo-300">Perubahan</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Filter Stats */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'Semua', count: stats.all, color: 'bg-gray-600', activeColor: 'bg-gray-500' },
                        { key: 'modified', label: 'Diubah', count: stats.modified, color: 'bg-amber-600/20 text-amber-400 border-amber-500/50', activeColor: 'bg-amber-600' },
                        { key: 'new', label: 'Baru', count: stats.new, color: 'bg-blue-600/20 text-blue-400 border-blue-500/50', activeColor: 'bg-blue-600' },
                        { key: 'deleted', label: 'Dihapus', count: stats.deleted, color: 'bg-red-600/20 text-red-400 border-red-500/50', activeColor: 'bg-red-600' },
                        { key: 'active', label: 'Sama', count: stats.active, color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50', activeColor: 'bg-emerald-600' },
                    ].map(({ key, label, count, color, activeColor }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as FilterType)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${filter === key
                                    ? `${activeColor} text-white border-transparent ring-2 ring-white/20`
                                    : `${color} border hover:opacity-80`
                                }`}
                        >
                            {label} <span className="ml-1 opacity-80">({count})</span>
                        </button>
                    ))}
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setExpandAll(!expandAll)}
                        className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        {expandAll ? '⬆️ Tutup Semua' : '⬇️ Buka Semua'}
                    </button>
                    <div className="flex rounded-lg overflow-hidden border border-gray-700">
                        <button
                            onClick={() => setViewMode('inline')}
                            className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'inline'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Inline
                        </button>
                        <button
                            onClick={() => setViewMode('side-by-side')}
                            className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'side-by-side'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Berdampingan
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-sm px-1">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/40 border-2 border-emerald-500"></span>
                    <span className="text-gray-300">Teks Ditambahkan</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-red-500/40 border-2 border-red-500"></span>
                    <span className="text-gray-300">Teks Dihapus</span>
                </div>
            </div>

            {/* Articles comparison */}
            <ScrollArea className="h-[65vh] pr-4">
                <div className="space-y-4 pb-8">
                    {filteredArticles.map((item) => (
                        <ArticleComparisonCard
                            key={item.number}
                            articleNumber={item.number}
                            oldArticle={item.oldArticle}
                            newArticle={item.newArticle}
                            status={item.status}
                            viewMode={viewMode}
                            oldVersionLabel={`${oldVersion.number}/${oldVersion.year}`}
                            newVersionLabel={`${newVersion.number}/${newVersion.year}`}
                            defaultExpanded={expandAll}
                        />
                    ))}

                    {filteredArticles.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <div className="text-4xl mb-3">🔍</div>
                            <p>Tidak ada pasal dengan filter &quot;{filter}&quot;</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface ArticleComparisonCardProps {
    articleNumber: string;
    oldArticle?: Article;
    newArticle?: Article;
    status: 'active' | 'modified' | 'deleted' | 'new';
    viewMode: 'inline' | 'side-by-side';
    oldVersionLabel: string;
    newVersionLabel: string;
    defaultExpanded: boolean;
}

function ArticleComparisonCard({
    articleNumber,
    oldArticle,
    newArticle,
    status,
    viewMode,
    oldVersionLabel,
    newVersionLabel,
    defaultExpanded
}: ArticleComparisonCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded && status !== 'active');

    // Color schemes per status
    const statusStyles = {
        active: 'border-gray-700 bg-gray-900/30',
        modified: 'border-amber-500/40 bg-amber-900/10',
        deleted: 'border-red-500/40 bg-red-900/10',
        new: 'border-blue-500/40 bg-blue-900/10'
    };

    const headerStyles = {
        active: 'hover:bg-gray-800/50',
        modified: 'hover:bg-amber-900/20',
        deleted: 'hover:bg-red-900/20',
        new: 'hover:bg-blue-900/20'
    };

    return (
        <Card className={`${statusStyles[status]} border-2 overflow-hidden transition-all`}>
            <CardHeader
                className={`py-4 px-5 cursor-pointer ${headerStyles[status]} transition-colors`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-lg font-bold text-white">
                            {articleNumber}
                        </CardTitle>
                        <Badge className={`${getStatusColor(status)} border text-xs px-2 py-0.5`}>
                            {status === 'active' ? '✓' : status === 'new' ? '✨' : status === 'deleted' ? '🗑️' : '✏️'}{' '}
                            {getStatusLabel(status)}
                        </Badge>
                    </div>
                    <span className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 pb-5 px-5">
                    {status === 'new' && newArticle && (
                        <div>
                            <div className="text-sm text-blue-400 mb-3 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Pasal baru ditambahkan di versi {newVersionLabel}
                            </div>
                            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                                <NewArticleText content={newArticle.content} />
                            </div>
                        </div>
                    )}

                    {status === 'deleted' && oldArticle && (
                        <div>
                            <div className="text-sm text-red-400 mb-3 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Pasal dihapus di versi {newVersionLabel}
                            </div>
                            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
                                <DeletedArticleText content={oldArticle.content} />
                            </div>
                        </div>
                    )}

                    {status === 'modified' && oldArticle && newArticle && (
                        <div>
                            <div className="text-sm text-amber-400 mb-3 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Perubahan dari versi {oldVersionLabel} ke {newVersionLabel}
                            </div>
                            {viewMode === 'inline' ? (
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <ArticleDiff
                                        oldContent={oldArticle.content}
                                        newContent={newArticle.content}
                                        showInline={true}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-2 font-medium">
                                            📄 Versi {oldVersionLabel} (Lama)
                                        </div>
                                        <div className="p-4 bg-red-900/10 rounded-lg border border-red-500/20 text-base leading-relaxed whitespace-pre-wrap text-gray-300">
                                            {oldArticle.content}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-2 font-medium">
                                            📄 Versi {newVersionLabel} (Baru)
                                        </div>
                                        <div className="p-4 bg-emerald-900/10 rounded-lg border border-emerald-500/20 text-base leading-relaxed whitespace-pre-wrap text-gray-200">
                                            {newArticle.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'active' && newArticle && (
                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 text-base leading-relaxed whitespace-pre-wrap text-gray-400">
                            {newArticle.content}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
