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
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full" />

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
                                        ? 'bg-indigo-600 ring-4 ring-indigo-400/50 scale-110'
                                        : canSelect
                                            ? 'bg-gray-800 hover:bg-gray-700 hover:scale-105 cursor-pointer'
                                            : 'bg-gray-800 opacity-50 cursor-not-allowed'
                                    }
                `}
                            >
                                <span className="text-white font-bold text-sm">
                                    {version.year.toString().slice(-2)}
                                </span>

                                {/* Selection indicator */}
                                {isSelected && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">
                                        {selectionIndex + 1}
                                    </span>
                                )}
                            </button>

                            {/* Version info */}
                            <div className="mt-3 text-center">
                                <div className="text-white font-semibold text-sm">
                                    No. {version.number}/{version.year}
                                </div>
                                <Badge
                                    className={`${getStatusColor(version.status)} border mt-1 text-xs`}
                                >
                                    {getStatusLabel(version.status)}
                                </Badge>
                                {version.effectiveDate && (
                                    <div className="text-gray-500 text-xs mt-1">
                                        {formatDate(version.effectiveDate)}
                                    </div>
                                )}
                            </div>

                            {/* Connection arrow */}
                            {index < versions.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full flex items-center justify-center pointer-events-none">
                                    <span className="text-gray-600 text-lg">→</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selection hint */}
            <div className="mt-6 text-center text-sm text-gray-400">
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
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                <span>{versions.length} versi</span>
                <span>•</span>
                <span>{firstYear} - {lastYear}</span>
            </div>

            {/* Mini timeline */}
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
                <div className="relative flex justify-between h-full">
                    {versions.map((version) => (
                        <div
                            key={version.id}
                            className="w-3 h-3 -mt-0.5 bg-white rounded-full border-2 border-indigo-600"
                            title={`Perpres ${version.number}/${version.year}`}
                        />
                    ))}
                </div>
            </div>

            {/* Year labels */}
            <div className="flex justify-between mt-1">
                {versions.map(version => (
                    <span key={version.id} className="text-xs text-gray-500">
                        {version.year}
                    </span>
                ))}
            </div>
        </div>
    );
}
