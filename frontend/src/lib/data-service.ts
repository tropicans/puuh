import { fetchFromBackend } from '@/lib/api';

export type RegulationFilters = {
    q?: string;
    typeId?: string;
    year?: number;
    regulationId?: string;
    page?: number;
    pageSize?: number;
};

export async function getFilteredRegulations(filters: RegulationFilters) {
    const { q, typeId, year, regulationId, page = 1, pageSize = 10 } = filters;
    
    const res = await fetchFromBackend<any>('/api/regulations/search', {
        method: 'GET',
        params: {
            q: q || '',
            typeId: typeId || '',
            year: year || '',
            regulationId: regulationId || '',
            page,
            pageSize
        }
    });

    if (!res.success || !res.data) {
        return {
            regulations: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page
        };
    }

    return res.data;
}

export async function getFilterOptions() {
    const res = await fetchFromBackend<{ types: any[]; years: number[] }>('/api/regulations/filter-options', {
        method: 'GET'
    });

    if (!res.success || !res.data) {
        return {
            types: [],
            years: []
        };
    }

    return res.data;
}
