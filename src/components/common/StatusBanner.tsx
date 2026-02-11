interface StatusBannerProps {
    tone: 'success' | 'error' | 'info' | 'warning';
    message: string;
    className?: string;
}

const toneClasses: Record<StatusBannerProps['tone'], string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-primary/30 bg-primary/10 text-primary',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

export function StatusBanner({ tone, message, className = '' }: StatusBannerProps) {
    const role = tone === 'error' ? 'alert' : 'status';

    return (
        <div className={`rounded-lg border p-4 ${toneClasses[tone]} ${className}`} role={role} aria-live="polite">
            {message}
        </div>
    );
}
