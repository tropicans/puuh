'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export function SearchInput({ placeholder }: { placeholder: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    // Debounce logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm) {
                params.set('q', searchTerm);
            } else {
                params.delete('q');
            }

            startTransition(() => {
                router.replace(`/?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, router, searchParams]);

    return (
        <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
            </div>
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isPending && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
}
