'use client';

import { Regulation } from '@/lib/dummy-data';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

interface VersionTimelineProps {
    regulation: Regulation;
    selectedVersions: string[];
    onVersionSelect: (versionId: string) => void;
    maxSelections?: number;
}

export function VersionTimeline({
    regulation,
    selectedVersions,
    onVersionSelect,
    maxSelections = 2
}: VersionTimelineProps) {
    const versions = regulation.versions;

    return (
        <div className="overflow-x-auto pb-2">
            <div className="relative min-w-[680px]">
            {/* Timeline line */}
            <div className="absolute left-0 right-0 top-6 h-1 rounded-full bg-primary/30" />

            {/* Version nodes */}
            <div className="relative flex justify-between">
                {versions.map((version, index) => {
                    const isSelected = selectedVersions.includes(version.id);
                    const selectionIndex = selectedVersions.indexOf(version.id);
                    const canSelect = selectedVersions.length < maxSelections || isSelected;

                    return (
                        <div
                            key={version.id}
                            className="flex flex-col items-center"
                            style={{ flex: 1 }}
                        >
                            {/* Node */}
                            <button
                                onClick={() => canSelect && onVersionSelect(version.id)}
                                disabled={!canSelect}
                                className={`
                  relative z-10 w-12 h-12 rounded-full flex items-center justify-center 
                  transition-all duration-300 
                  ${isSelected
                                        ? 'bg-primary ring-4 ring-primary/30 scale-110'
                                        : canSelect
                                            ? 'bg-card hover:bg-accent hover:scale-105 cursor-pointer border border-border/70'
                                            : 'bg-card opacity-50 cursor-not-allowed border border-border/70'
                                    }
                `}
                            >
                                <span className="text-foreground font-bold text-sm">
                                    {version.year.toString().slice(-2)}
                                </span>

                                {/* Selection indicator */}
                                {isSelected && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                        {selectionIndex + 1}
                                    </span>
                                )}
                            </button>

                            {/* Version info */}
                            <div className="mt-3 text-center">
                                <div className="text-foreground font-semibold text-sm">
                                    No. {version.number}/{version.year}
                                </div>
                                <Badge
                                    className={`${getStatusColor(version.status)} border mt-1 text-xs`}
                                >
                                    {getStatusLabel(version.status)}
                                </Badge>
                                {version.effectiveDate && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(version.effectiveDate)}
                                    </div>
                                )}
                            </div>

                            {/* Connection arrow */}
                            {index < versions.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full flex items-center justify-center pointer-events-none">
                                    <span className="text-muted-foreground text-lg">→</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selection hint */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
                {selectedVersions.length === 0 && (
                    <span>Pilih 2 versi untuk membandingkan</span>
                )}
                {selectedVersions.length === 1 && (
                    <span>Pilih 1 versi lagi untuk membandingkan</span>
                )}
                {selectedVersions.length === 2 && (
                    <span className="text-emerald-400">✓ 2 versi terpilih - siap untuk dibandingkan</span>
                )}
            </div>
            </div>
        </div>
    );
}

/**
 * Compact timeline untuk display di card
 */
export function CompactTimeline({ regulation }: { regulation: Regulation }) {
    const versions = regulation.versions;
    const firstYear = versions[0]?.year;
    const lastYear = versions[versions.length - 1]?.year;

    return (
        <div className="mt-4">
            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <span>{versions.length} versi</span>
                <span>•</span>
                <span>{firstYear} - {lastYear}</span>
            </div>

            {/* Mini timeline */}
            <div className="relative h-2 overflow-hidden rounded-full bg-muted/50">
                <div className="absolute inset-0 bg-primary/50" />
                <div className="relative flex justify-between h-full">
                    {versions.map((version) => (
                        <div
                            key={version.id}
                            className="-mt-0.5 h-3 w-3 rounded-full border-2 border-primary bg-background"
                            title={`Perpres ${version.number}/${version.year}`}
                        />
                    ))}
                </div>
            </div>

            {/* Year labels */}
            <div className="flex justify-between mt-1">
                {versions.map(version => (
                    <span key={version.id} className="text-xs text-muted-foreground">
                        {version.year}
                    </span>
                ))}
            </div>
        </div>
    );
}
