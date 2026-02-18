'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

export function SearchInput({ placeholder }: { placeholder: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentQuery = searchParams.get('q') || '';

    // Keyboard shortcut (Ctrl+K or /)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (
                e.key === '/' &&
                document.activeElement !== inputRef.current &&
                !isTypingTarget(document.activeElement)
            ) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const handleChange = (value: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (value === currentQuery) {
                return;
            }

            const params = new URLSearchParams(searchParams);

            if (value) {
                params.set('q', value);
            } else {
                params.delete('q');
            }
            params.delete('page');

            const queryString = params.toString();
            startTransition(() => {
                router.replace(queryString ? `/?${queryString}` : '/');
            });
        }, 300);
    };

    return (
        <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
            </div>
            <Input
                ref={inputRef}
                key={currentQuery}
                type="text"
                defaultValue={currentQuery}
                placeholder={placeholder}
                className="pl-10 pr-12 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-indigo-500 transition-all"
                onChange={(e) => handleChange(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-700 bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                )}
            </div>
        </div>
    );
}
