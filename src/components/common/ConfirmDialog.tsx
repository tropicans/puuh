'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    destructive = false,
    loading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;
        lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        cancelButtonRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (open) return;
        lastFocusedElementRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !loading) {
                onClose();
                return;
            }

            if (event.key === 'Tab') {
                const root = dialogRef.current;
                if (!root) return;

                const focusableElements = Array.from(
                    root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
                ).filter((el) => !el.hasAttribute('disabled'));

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                const currentElement = document.activeElement as HTMLElement | null;

                if (event.shiftKey && currentElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                    return;
                }

                if (!event.shiftKey && currentElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, loading, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <div ref={dialogRef} className="w-full max-w-md rounded-xl border border-border/70 bg-card p-5">
                <h2 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                <div className="mt-5 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} ref={cancelButtonRef}>
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={destructive ? 'bg-red-600 text-white hover:bg-red-500' : ''}
                    >
                        {loading ? 'Memproses...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
