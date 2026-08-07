'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`/dashboard?${params.toString()}`);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800"
            >
                Previous
            </Button>

            <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800"
            >
                Next
            </Button>
        </div>
    );
}
