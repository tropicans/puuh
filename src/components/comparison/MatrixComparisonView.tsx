'use client';

import { useState, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArticleDiff } from './ArticleDiff';

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

interface MatrixComparisonViewProps {
    versions: RegulationVersion[];
    regulationTitle: string;
}

type ArticleStatus = 'same' | 'modified' | 'new' | 'inherited';

interface ArticleRow {
    articleNumber: string;
    versions: (Article | null)[];
    status: ArticleStatus;
    inheritedFromVersion?: number; // Index of version where article was last defined
}

export function MatrixComparisonView({ versions, regulationTitle }: MatrixComparisonViewProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, versions.length - 1]);

    // Sort versions by year
    const sortedVersions = [...versions].sort((a, b) => a.year - b.year);

    // Collect all unique article numbers
    const allArticleNumbers = new Set<string>();
    sortedVersions.forEach(v => {
        v.articles.forEach(a => allArticleNumbers.add(a.number));
    });

    // Build article rows
    const articleRows: ArticleRow[] = Array.from(allArticleNumbers)
        .map(articleNumber => {
            const versionArticles = sortedVersions.map(v =>
                v.articles.find(a => a.number === articleNumber) || null
            );

            // Determine status
            let status: ArticleStatus = 'same';
            let inheritedFromVersion: number | undefined = undefined;

            // Find the last version that has this article
            const lastVersionWithArticle = versionArticles.findLastIndex(a => a !== null);
            const firstVersionWithArticle = versionArticles.findIndex(a => a !== null);

            // Get all non-null contents to check for modifications
            const contents = versionArticles.filter(a => a !== null).map(a => a!.content);

            if (firstVersionWithArticle > 0) {
                // Article first appears after the first version = NEW
                status = 'new';
            } else if (lastVersionWithArticle < versionArticles.length - 1 && lastVersionWithArticle >= 0) {
                // Article doesn't appear in latest version(s) but exists in earlier version
                // For amendments, this means it's INHERITED (still valid from earlier version)
                status = 'inherited';
                inheritedFromVersion = lastVersionWithArticle;
            } else if (new Set(contents).size > 1) {
                // Multiple different contents = MODIFIED
                status = 'modified';
            }

            return {
                articleNumber,
                versions: versionArticles,
                status,
                inheritedFromVersion
            };
        })
        .sort((a, b) => {
            const numA = parseInt(a.articleNumber.replace(/\D/g, '') || '0');
            const numB = parseInt(b.articleNumber.replace(/\D/g, '') || '0');
            return numA - numB;
        });

    // Stats
    const stats = {
        total: articleRows.length,
        same: articleRows.filter(r => r.status === 'same').length,
        modified: articleRows.filter(r => r.status === 'modified').length,
        new: articleRows.filter(r => r.status === 'new').length,
        inherited: articleRows.filter(r => r.status === 'inherited').length,
    };

    const statusColors: Record<ArticleStatus, string> = {
        same: 'bg-gray-700 text-gray-300',
        modified: 'bg-amber-600 text-white',
        new: 'bg-blue-600 text-white',
        inherited: 'bg-emerald-600 text-white'
    };

    const statusLabels: Record<ArticleStatus, string> = {
        same: 'Sama',
        modified: 'Diubah',
        new: 'Baru',
        inherited: 'Berlaku'
    };

    const rowBgColors: Record<ArticleStatus, string> = {
        same: 'hover:bg-gray-800/50',
        modified: 'bg-amber-900/10 hover:bg-amber-900/20',
        new: 'bg-blue-900/10 hover:bg-blue-900/20',
        inherited: 'bg-emerald-900/10 hover:bg-emerald-900/20'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-500/30">
                <CardContent className="py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">📊 Matriks Perbandingan</h2>
                            <p className="text-indigo-200 mt-1">{regulationTitle}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{sortedVersions.length}</div>
                                <div className="text-xs text-indigo-300">Versi</div>
                            </div>
                            <div className="h-8 w-px bg-indigo-500/30"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{stats.total}</div>
                                <div className="text-xs text-indigo-300">Pasal</div>
                            </div>
                            <div className="h-8 w-px bg-indigo-500/30"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-400">{stats.modified + stats.new}</div>
                                <div className="text-xs text-indigo-300">Perubahan</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3">
                {[
                    { key: 'same', label: 'Sama', count: stats.same, color: 'bg-gray-600' },
                    { key: 'modified', label: 'Diubah', count: stats.modified, color: 'bg-amber-600' },
                    { key: 'new', label: 'Baru', count: stats.new, color: 'bg-blue-600' },
                    { key: 'inherited', label: 'Berlaku (Lama)', count: stats.inherited, color: 'bg-emerald-600' },
                ].map(({ key, label, count, color }) => (
                    <div key={key} className={`${color} px-3 py-1.5 rounded-full text-white text-sm font-medium`}>
                        {label}: {count}
                    </div>
                ))}
            </div>

            {/* Version selector for diff */}
            {sortedVersions.length > 2 && (
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">Bandingkan:</span>
                    <select
                        value={selectedVersions[0]}
                        onChange={(e) => setSelectedVersions([parseInt(e.target.value), selectedVersions[1]])}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white"
                    >
                        {sortedVersions.map((v, i) => (
                            <option key={v.id} value={i}>{v.number}/{v.year}</option>
                        ))}
                    </select>
                    <span className="text-gray-500">dengan</span>
                    <select
                        value={selectedVersions[1]}
                        onChange={(e) => setSelectedVersions([selectedVersions[0], parseInt(e.target.value)])}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white"
                    >
                        {sortedVersions.map((v, i) => (
                            <option key={v.id} value={i}>{v.number}/{v.year}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800/80">
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold sticky left-0 bg-gray-800/80 z-10 min-w-[100px]">
                                Pasal
                            </th>
                            {sortedVersions.map((v, i) => (
                                <th
                                    key={v.id}
                                    className={`px-4 py-3 text-left font-semibold min-w-[200px] ${i === selectedVersions[0] || i === selectedVersions[1]
                                        ? 'text-indigo-300 bg-indigo-900/20'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <div>{v.number}/{v.year}</div>
                                    <div className="text-xs font-normal opacity-60">{v.articles.length} pasal</div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-gray-300 font-semibold min-w-[100px]">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {articleRows.map((row) => (
                            <Fragment key={row.articleNumber}>
                                <tr
                                    className={`border-t border-gray-700/50 cursor-pointer transition-colors ${rowBgColors[row.status]}`}
                                    onClick={() => setExpandedRow(expandedRow === row.articleNumber ? null : row.articleNumber)}
                                >
                                    <td className="px-4 py-3 font-semibold text-white sticky left-0 bg-gray-900/90 z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`transition-transform ${expandedRow === row.articleNumber ? 'rotate-90' : ''}`}>
                                                ▶
                                            </span>
                                            {row.articleNumber}
                                        </div>
                                    </td>
                                    {row.versions.map((article, vIdx) => (
                                        <td
                                            key={vIdx}
                                            className={`px-4 py-3 ${vIdx === selectedVersions[0] || vIdx === selectedVersions[1]
                                                ? 'bg-indigo-900/10'
                                                : ''
                                                }`}
                                        >
                                            {article ? (
                                                <div className="text-gray-300 line-clamp-2 text-xs leading-relaxed">
                                                    {article.content.substring(0, 150)}
                                                    {article.content.length > 150 ? '...' : ''}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic">—</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
                                        <Badge className={`${statusColors[row.status]} text-xs`}>
                                            {statusLabels[row.status]}
                                        </Badge>
                                    </td>
                                </tr>

                                {/* Expanded Detail Row */}
                                {expandedRow === row.articleNumber && (
                                    <tr className="border-t border-gray-700/30">
                                        <td colSpan={sortedVersions.length + 2} className="p-0">
                                            <div className="p-5 bg-gray-800/50">
                                                <div className="text-sm text-gray-400 mb-3 font-medium">
                                                    📝 Detail {row.articleNumber} - Perbandingan versi {sortedVersions[selectedVersions[0]]?.number}/{sortedVersions[selectedVersions[0]]?.year} vs {sortedVersions[selectedVersions[1]]?.number}/{sortedVersions[selectedVersions[1]]?.year}
                                                </div>

                                                {(() => {
                                                    const oldContent = row.versions[selectedVersions[0]];
                                                    const newContent = row.versions[selectedVersions[1]];

                                                    // Find first available version with content (fallback)
                                                    const firstAvailable = row.versions.find(v => v !== null);
                                                    const lastAvailable = [...row.versions].reverse().find(v => v !== null);

                                                    if (oldContent && newContent) {
                                                        // Both versions have the article
                                                        if (oldContent.content === newContent.content) {
                                                            return (
                                                                <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                                                                    {newContent.content}
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                                                    <ArticleDiff
                                                                        oldContent={oldContent.content}
                                                                        newContent={newContent.content}
                                                                        showInline={true}
                                                                    />
                                                                </div>
                                                            );
                                                        }
                                                    } else if (newContent) {
                                                        // Only new version has it - NEW article
                                                        return (
                                                            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                                                                <div className="text-blue-400 text-sm mb-2">✨ Pasal baru di versi {sortedVersions[selectedVersions[1]]?.year}</div>
                                                                <div className="text-emerald-200 text-base leading-relaxed whitespace-pre-wrap">
                                                                    {newContent.content}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (oldContent) {
                                                        // Only old version has it - INHERITED
                                                        return (
                                                            <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/30">
                                                                <div className="text-emerald-400 text-sm mb-2">✅ Tetap berlaku dari versi {sortedVersions[selectedVersions[0]]?.year} (tidak diubah di versi baru)</div>
                                                                <div className="text-emerald-200 text-base leading-relaxed whitespace-pre-wrap">
                                                                    {oldContent.content}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (lastAvailable) {
                                                        // Fallback: show content from any available version
                                                        const versionIndex = row.versions.findIndex(v => v === lastAvailable);
                                                        return (
                                                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                                <div className="text-gray-400 text-sm mb-2">📄 Konten dari versi {sortedVersions[versionIndex]?.year}</div>
                                                                <div className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                                                                    {lastAvailable.content}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return <div className="text-gray-500 italic">Tidak ada konten</div>;
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">💡 Klik baris untuk melihat detail perbandingan</span>
                </div>
            </div>
        </div>
    );
}
