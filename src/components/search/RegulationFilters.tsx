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

        params.delete('page');
        const queryString = params.toString();
        router.replace(queryString ? `/?${queryString}` : '/');
    };

    return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full md:w-auto">
            {/* Type Filter */}
            <div className="relative w-full sm:w-auto">
                <select
                    className="w-full sm:w-auto bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-10"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>

            {/* Year Filter */}
            <div className="relative w-full sm:w-auto">
                <select
                    className="w-full sm:w-auto bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-10"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>
        </div>
    );
}
