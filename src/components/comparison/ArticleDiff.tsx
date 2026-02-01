'use client';

import { compareTexts, DiffPart } from '@/lib/diff-engine';

interface ArticleDiffProps {
    oldContent: string;
    newContent: string;
    showInline?: boolean;
}

/**
 * Komponen untuk menampilkan diff verbatim antara dua teks pasal
 * dengan highlighting warna:
 * - 🟢 Hijau: Teks baru ditambahkan
 * - 🔴 Merah: Teks dihapus
 */
export function ArticleDiff({ oldContent, newContent, showInline = true }: ArticleDiffProps) {
    const diff = compareTexts(oldContent, newContent);

    if (showInline) {
        return (
            <div className="text-base leading-loose whitespace-pre-wrap">
                {diff.parts.map((part, index) => (
                    <DiffSpan key={index} part={part} />
                ))}
            </div>
        );
    }

    // Side-by-side view
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="text-base leading-loose whitespace-pre-wrap">
                {diff.parts
                    .filter(p => p.type !== 'insert')
                    .map((part, index) => (
                        <DiffSpan key={index} part={part} showDeleted />
                    ))}
            </div>
            <div className="text-base leading-loose whitespace-pre-wrap">
                {diff.parts
                    .filter(p => p.type !== 'delete')
                    .map((part, index) => (
                        <DiffSpan key={index} part={part} showInserted />
                    ))}
            </div>
        </div>
    );
}

interface DiffSpanProps {
    part: DiffPart;
    showDeleted?: boolean;
    showInserted?: boolean;
}

function DiffSpan({ part }: DiffSpanProps) {
    switch (part.type) {
        case 'delete':
            return (
                <span
                    className="bg-red-500/40 text-red-200 line-through decoration-red-400 decoration-2 px-0.5 rounded"
                    title="Teks dihapus"
                >
                    {part.value}
                </span>
            );
        case 'insert':
            return (
                <span
                    className="bg-emerald-500/40 text-emerald-200 px-0.5 rounded font-medium"
                    title="Teks ditambahkan"
                >
                    {part.value}
                </span>
            );
        case 'equal':
        default:
            return <span className="text-gray-200">{part.value}</span>;
    }
}

/**
 * Menampilkan teks dengan semua konten baru (hijau) untuk pasal baru
 */
export function NewArticleText({ content }: { content: string }) {
    return (
        <div className="text-base leading-loose whitespace-pre-wrap">
            <span className="text-emerald-200">
                {content}
            </span>
        </div>
    );
}

/**
 * Menampilkan teks dengan semua konten dihapus (merah) untuk pasal yang dihapus
 */
export function DeletedArticleText({ content }: { content: string }) {
    return (
        <div className="text-base leading-loose whitespace-pre-wrap">
            <span className="text-red-200 line-through decoration-red-400 decoration-2">
                {content}
            </span>
        </div>
    );
}
