'use client';

import { useEffect, useRef, useState } from 'react';

export type FlashMessageTone = 'success' | 'error';

export interface FlashMessage {
    type: FlashMessageTone;
    text: string;
}

export function useFlashMessage() {
    const [message, setMessage] = useState<FlashMessage | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showMessage = (nextMessage: FlashMessage, durationMs = 3000) => {
        setMessage(nextMessage);
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            setMessage(null);
            timeoutRef.current = null;
        }, durationMs);
    };

    const clearMessage = () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setMessage(null);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { message, showMessage, clearMessage };
}
