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
            <Card className="group relative flex h-full cursor-pointer flex-col overflow-hidden border-border/70 bg-card/70 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">

                <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                {regulation.type}
                            </Badge>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {regulation.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="relative flex-1 flex flex-col">
                    <p className="mb-6 line-clamp-2 text-sm text-muted-foreground">
                        {regulation.description}
                    </p>

                    <div className="mt-auto">
                        <CompactTimeline regulation={regulation} />

                        <div className="mt-6 flex items-center gap-4 border-t border-border/60 pt-4 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{totalArticles} Pasal</span>
                            </div>
                            {latestVersion && (
                                <div className="flex items-center gap-1.5 text-emerald-400">
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
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                    Belum ada peraturan
                </h3>
                <p className="text-muted-foreground">
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
