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

/**
 * Clean extracted markdown text to remove headers, footers, and page numbers,
 * without removing solitary numbers that might be part of markdown tables.
 */
export function cleanMarkdownText(text: string): string {
  return text
    // Remove "PRESIDEN REPUBLIK INDONESIA" and variations
    .replace(/(^|\n)\s*PRESIDEN\s+REPUBLIK\s+INDONESIA\s*($|\n)/gi, '\n')
    .replace(/(^|\n)\s*REPUBLIK\s+INDONESIA\s*($|\n)/gi, '\n')
    // Remove page numbers like "- 12 -" or " - 10 -"
    .replace(/(^|\n)\s*-\s*\d+\s*-\s*($|\n)/g, '\n')
    // Remove "SALINAN" 
    .replace(/(^|\n)\s*SALINAN\s*($|\n)/gi, '\n')
    // Fix multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
