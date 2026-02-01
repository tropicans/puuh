import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'modified':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'deleted':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'new':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'amended':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'revoked':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Berlaku';
    case 'modified':
      return 'Diubah';
    case 'deleted':
      return 'Dihapus';
    case 'new':
      return 'Baru';
    case 'amended':
      return 'Diubah';
    case 'revoked':
      return 'Dicabut';
    default:
      return status;
  }
}

/**
 * Clean extracted text to remove headers, footers, and page numbers
 */
export function cleanPdfText(text: string): string {
  return text
    // Remove "PRESIDEN REPUBLIK INDONESIA" and variations
    .replace(/(^|\n)\s*PRESIDEN\s+REPUBLIK\s+INDONESIA\s*($|\n)/gi, '\n')
    .replace(/(^|\n)\s*REPUBLIK\s+INDONESIA\s*($|\n)/gi, '\n')
    // Remove page numbers like "- 12 -" or " - 10 -"
    .replace(/(^|\n)\s*-\s*\d+\s*-\s*($|\n)/g, '\n')
    // Remove solitary numbers that look like page numbers
    .replace(/(^|\n)\s*\d+\s*($|\n)/g, '\n')
    // Remove "SALINAN" 
    .replace(/(^|\n)\s*SALINAN\s*($|\n)/gi, '\n')
    // Fix multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
