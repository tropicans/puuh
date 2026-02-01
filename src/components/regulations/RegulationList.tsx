'use client';

import { Regulation } from '@/lib/dummy-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompactTimeline } from './VersionTimeline';
import Link from 'next/link';

interface RegulationCardProps {
    regulation: Regulation;
}

export function RegulationCard({ regulation }: RegulationCardProps) {
    const latestVersion = regulation.versions[regulation.versions.length - 1];
    const totalArticles = latestVersion?.articles.length || 0;

    return (
        <Link href={`/regulations/${regulation.id}`}>
            <Card className="bg-gray-900/50 border-gray-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer group">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📋</span>
                            <Badge variant="outline" className="text-indigo-400 border-indigo-400/30">
                                {regulation.type}
                            </Badge>
                        </div>
                        <span className="text-gray-500 group-hover:text-indigo-400 transition-colors">
                            →
                        </span>
                    </div>
                    <CardTitle className="text-lg font-semibold text-white mt-2 group-hover:text-indigo-300 transition-colors">
                        {regulation.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-400 text-sm line-clamp-2">
                        {regulation.description}
                    </p>

                    <CompactTimeline regulation={regulation} />

                    <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                            <span>📝</span>
                            <span>{totalArticles} pasal</span>
                        </div>
                        {latestVersion && (
                            <div className="flex items-center gap-1 text-emerald-400">
                                <span>✓</span>
                                <span>Versi terbaru: {latestVersion.year}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

interface RegulationListProps {
    regulations: Regulation[];
}

export function RegulationList({ regulations }: RegulationListProps) {
    if (regulations.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Belum ada peraturan
                </h3>
                <p className="text-gray-500">
                    Upload peraturan pertama untuk memulai
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regulations.map(regulation => (
                <RegulationCard key={regulation.id} regulation={regulation} />
            ))}
        </div>
    );
}
