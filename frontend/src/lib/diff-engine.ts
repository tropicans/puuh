// Diff engine untuk perbandingan verbatim teks pasal
// Menghasilkan diff yang bisa di-render dengan highlighting

export interface DiffPart {
    type: 'equal' | 'insert' | 'delete';
    value: string;
}

export interface DiffResult {
    parts: DiffPart[];
    hasChanges: boolean;
    addedCount: number;
    deletedCount: number;
}

/**
 * Membandingkan dua string secara verbatim (word-by-word)
 * dan menghasilkan diff parts untuk rendering dengan highlighting
 */
export function compareTexts(oldText: string, newText: string): DiffResult {
    const oldWords = tokenize(oldText);
    const newWords = tokenize(newText);

    const lcs = longestCommonSubsequence(oldWords, newWords);
    const parts: DiffPart[] = [];

    let oldIndex = 0;
    let newIndex = 0;
    let lcsIndex = 0;
    let addedCount = 0;
    let deletedCount = 0;

    while (oldIndex < oldWords.length || newIndex < newWords.length) {
        if (lcsIndex < lcs.length) {
            // Tambahkan deleted words dari old yang tidak ada di LCS
            let deletedPart = '';
            while (oldIndex < oldWords.length && oldWords[oldIndex] !== lcs[lcsIndex]) {
                deletedPart += oldWords[oldIndex];
                oldIndex++;
                deletedCount++;
            }
            if (deletedPart) {
                parts.push({ type: 'delete', value: deletedPart });
            }

            // Tambahkan inserted words dari new yang tidak ada di LCS
            let insertedPart = '';
            while (newIndex < newWords.length && newWords[newIndex] !== lcs[lcsIndex]) {
                insertedPart += newWords[newIndex];
                newIndex++;
                addedCount++;
            }
            if (insertedPart) {
                parts.push({ type: 'insert', value: insertedPart });
            }

            // Tambahkan equal part (yang ada di LCS)
            if (lcsIndex < lcs.length) {
                parts.push({ type: 'equal', value: lcs[lcsIndex] });
                oldIndex++;
                newIndex++;
                lcsIndex++;
            }
        } else {
            // Sisa dari old adalah deleted
            let deletedPart = '';
            while (oldIndex < oldWords.length) {
                deletedPart += oldWords[oldIndex];
                oldIndex++;
                deletedCount++;
            }
            if (deletedPart) {
                parts.push({ type: 'delete', value: deletedPart });
            }

            // Sisa dari new adalah inserted
            let insertedPart = '';
            while (newIndex < newWords.length) {
                insertedPart += newWords[newIndex];
                newIndex++;
                addedCount++;
            }
            if (insertedPart) {
                parts.push({ type: 'insert', value: insertedPart });
            }
        }
    }

    // Merge adjacent parts dengan type yang sama
    const mergedParts = mergeParts(parts);

    return {
        parts: mergedParts,
        hasChanges: addedCount > 0 || deletedCount > 0,
        addedCount,
        deletedCount
    };
}

/**
 * Tokenize text menjadi words dan whitespace/punctuation
 */
function tokenize(text: string): string[] {
    // Split pada boundaries tapi keep whitespace dan punctuation
    const tokens: string[] = [];
    let current = '';

    for (const char of text) {
        if (/\s/.test(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            tokens.push(char);
        } else if (/[.,;:!?()\[\]{}]/.test(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            tokens.push(char);
        } else {
            current += char;
        }
    }

    if (current) {
        tokens.push(current);
    }

    return tokens;
}

/**
 * Longest Common Subsequence algorithm
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;

    // DP table
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack untuk mendapatkan LCS
    const lcs: string[] = [];
    let i = m, j = n;

    while (i > 0 && j > 0) {
        if (arr1[i - 1] === arr2[j - 1]) {
            lcs.unshift(arr1[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
}

/**
 * Merge adjacent parts dengan type yang sama
 */
function mergeParts(parts: DiffPart[]): DiffPart[] {
    if (parts.length === 0) return [];

    const merged: DiffPart[] = [];
    let current = { ...parts[0] };

    for (let i = 1; i < parts.length; i++) {
        if (parts[i].type === current.type) {
            current.value += parts[i].value;
        } else {
            merged.push(current);
            current = { ...parts[i] };
        }
    }

    merged.push(current);
    return merged;
}

/**
 * Generate simple diff summary
 */
export function getDiffSummary(oldText: string, newText: string): string {
    const diff = compareTexts(oldText, newText);

    if (!diff.hasChanges) {
        return 'Tidak ada perubahan';
    }

    const parts: string[] = [];
    if (diff.addedCount > 0) {
        parts.push(`+${diff.addedCount} kata ditambahkan`);
    }
    if (diff.deletedCount > 0) {
        parts.push(`-${diff.deletedCount} kata dihapus`);
    }

    return parts.join(', ');
}
