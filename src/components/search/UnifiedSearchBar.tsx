'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, Filter, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    types: { id: string; name: string; shortName: string }[];
    years: number[];
}

export function UnifiedSearchBar({ types, years }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const currentType = searchParams.get('type') || 'all';
    const currentYear = searchParams.get('year') || 'all';

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm) {
                params.set('q', searchTerm);
            } else {
                params.delete('q');
            }
            startTransition(() => {
                const query = params.toString();
                router.replace(query ? `/dashboard?${query}` : '/dashboard');
            });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, searchParams]);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        const query = params.toString();
        router.replace(query ? `/dashboard?${query}` : '/dashboard');
    };

    const exportUrl = `/api/export${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <div className="glass-container rounded-2xl p-2 md:p-3 shadow-2xl shadow-indigo-500/10 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input Box */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Cari kata kunci, nomor, atau judul..."
                        className="w-full bg-white/5 border-transparent h-12 pl-12 pr-10 rounded-xl focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isPending && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />
                    )}
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden md:block w-px h-8 bg-white/10" />

                {/* Filters Group */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-auto min-w-[140px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                            className="w-full appearance-none bg-white/5 border border-transparent hover:border-white/10 h-10 pl-9 pr-8 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-all"
                            value={currentType}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="all">Semua Jenis</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>{t.shortName}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    <div className="relative w-full sm:w-auto min-w-[120px]">
                        <select
                            className="w-full appearance-none bg-white/5 border border-transparent hover:border-white/10 h-10 px-4 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-all"
                            value={currentYear}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            <option value="all">Semua Tahun</option>
                            {years.map((y) => (
                                <option key={y} value={y.toString()}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Action Button */}
                    <a
                        href={exportUrl}
                        target="_blank"
                        className="flex items-center gap-2 px-5 h-10 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap w-full sm:w-auto justify-center"
                    >
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </a>
                </div>
            </div>

            {/* Active Filters Display */}
            {(currentType !== 'all' || currentYear !== 'all' || searchTerm) && (
                <div className="flex flex-wrap gap-2 mt-4 items-center animate-fade-in">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Filter Aktif:</span>
                    {searchTerm && (
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                            Kata kunci: {searchTerm}
                        </Badge>
                    )}
                    {currentType !== 'all' && (
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1">
                            Jenis: {types.find(t => t.id === currentType)?.shortName}
                        </Badge>
                    )}
                    {currentYear !== 'all' && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                            Tahun: {currentYear}
                        </Badge>
                    )}
                    <button
                        onClick={() => router.replace('/dashboard')}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors ml-2"
                    >
                        Reset All
                    </button>
                </div>
            )}
        </div>
    );
}
