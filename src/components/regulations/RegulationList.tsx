'use client';

import { Regulation } from '@/lib/dummy-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { CompactTimeline } from './VersionTimeline';
import Link from 'next/link';

interface RegulationCardProps {
    regulation: Regulation;
}

export function RegulationCard({ regulation }: RegulationCardProps) {
    const latestVersion = regulation.versions[regulation.versions.length - 1];
    const totalArticles = latestVersion?.articles.length || 0;

    return (
        <Link href={`/regulations/${regulation.id}`} className="block h-full">
            <Card className="bg-white/[0.03] border-white/5 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer group h-full flex flex-col backdrop-blur-sm overflow-hidden relative">
                {/* Hover Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>

                <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 border-indigo-400/20 bg-indigo-400/5">
                                {regulation.type}
                            </Badge>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                        {regulation.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="relative flex-1 flex flex-col">
                    <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                        {regulation.description}
                    </p>

                    <div className="mt-auto">
                        <CompactTimeline regulation={regulation} />

                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <FileText className="w-3.5 h-3.5 text-gray-500" />
                                <span>{totalArticles} Pasal</span>
                            </div>
                            {latestVersion && (
                                <div className="flex items-center gap-1.5 text-emerald-400/80">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Aktif ({latestVersion.year})</span>
                                </div>
                            )}
                        </div>
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
