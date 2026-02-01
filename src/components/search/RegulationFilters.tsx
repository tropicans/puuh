'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
    types: { id: string; name: string; shortName: string }[];
    years: number[];
}

export function RegulationFilters({ types, years }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.replace(`/?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <select
                className="bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchParams.get('type') || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
            >
                <option value="all">Semua Jenis</option>
                {types.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.shortName} ({t.name})
                    </option>
                ))}
            </select>

            {/* Year Filter */}
            <select
                className="bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchParams.get('year') || 'all'}
                onChange={(e) => handleFilterChange('year', e.target.value)}
            >
                <option value="all">Semua Tahun</option>
                {years.map((y) => (
                    <option key={y} value={y.toString()}>
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
}
