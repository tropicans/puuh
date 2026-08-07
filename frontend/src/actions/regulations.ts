'use server';

import { revalidatePath } from 'next/cache';
import { fetchFromBackend } from '@/lib/api';

// Types for error handling
interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ==================== Regulation Types ====================

export async function getRegulationTypes(): Promise<ActionResult<any[]>> {
    const res = await fetchFromBackend<any[]>('/api/regulations/types', { method: 'GET' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengambil jenis peraturan' };
    }
    return { success: true, data: res.data };
}

export async function createRegulationType(data: { name: string; shortName: string }) {
    const res = await fetchFromBackend<any>('/api/regulations/types', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal membuat jenis peraturan' };
    }
    revalidatePath('/');
    return { success: true, data: res.data };
}

// ==================== Regulations ====================

export async function getRegulations() {
    const res = await fetchFromBackend<{ regulations: any[] }>('/api/regulations', { method: 'GET' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengambil daftar peraturan' };
    }
    return { success: true, data: res.data.regulations };
}

export async function getRegulationById(id: string) {
    const res = await fetchFromBackend<{ regulation: any }>('/api/regulations/' + id, { method: 'GET' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengambil detail peraturan' };
    }
    return { success: true, data: res.data.regulation };
}

export async function createRegulation(data: {
    title: string;
    description?: string;
    typeId: string;
}) {
    const res = await fetchFromBackend<any>('/api/regulations', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal membuat peraturan' };
    }
    revalidatePath('/');
    return { success: true, data: res.data };
}

export async function deleteRegulation(id: string) {
    const res = await fetchFromBackend<any>('/api/regulations/' + id, { method: 'DELETE' });
    if (!res.success) {
        return { success: false, error: res.error || 'Gagal menghapus peraturan' };
    }
    revalidatePath('/');
    return { success: true };
}

// ==================== Regulation Versions ====================

export async function getVersionById(id: string) {
    const res = await fetchFromBackend<{ version: any }>('/api/versions/' + id, { method: 'GET' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengambil detail versi' };
    }
    return { success: true, data: res.data.version };
}

export async function createVersion(data: {
    regulationId: string;
    number: string;
    year: number;
    fullTitle: string;
    effectiveDate?: Date;
    pdfPath?: string;
    rawText?: string;
    amendsId?: string;
}) {
    const res = await fetchFromBackend<any>('/api/versions', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal membuat versi baru' };
    }
    revalidatePath('/');
    revalidatePath(`/regulations/${data.regulationId}`);
    return { success: true, data: res.data };
}

export async function updateVersionStatus(id: string, status: 'ACTIVE' | 'AMENDED' | 'REVOKED') {
    const res = await fetchFromBackend<any>('/api/versions/' + id + '/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengubah status versi' };
    }
    revalidatePath('/');
    return { success: true, data: res.data };
}

// ==================== Articles ====================

export async function getArticlesByVersionId(versionId: string) {
    const res = await fetchFromBackend<any[]>('/api/articles/versions/' + versionId, { method: 'GET' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mengambil daftar pasal' };
    }
    return { success: true, data: res.data };
}

export async function createArticles(versionId: string, articles: {
    articleNumber: string;
    content: string;
    status?: 'ACTIVE' | 'MODIFIED' | 'DELETED' | 'NEW';
}[]) {
    const res = await fetchFromBackend<any>('/api/articles/versions/' + versionId, {
        method: 'POST',
        body: JSON.stringify({ articles })
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal membuat pasal' };
    }
    revalidatePath('/');
    return { success: true, data: res.data };
}

// ==================== Article Changes ====================

export async function createArticleChange(data: {
    articleId: string;
    changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
    oldContent?: string;
    newContent?: string;
    diffHtml?: string;
    changedInYear: number;
    notes?: string;
}) {
    const res = await fetchFromBackend<any>('/api/article-changes', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal mencatat perubahan pasal' };
    }
    return { success: true, data: res.data };
}

// ==================== Seeds ====================

export async function seedInitialData() {
    const res = await fetchFromBackend<any>('/api/seed', { method: 'POST' });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Gagal membuat data awal' };
    }
    revalidatePath('/');
    return { success: true, message: res.data.message || 'Data berhasil di-seed' };
}

// ==================== Database Status ====================

export async function checkDatabaseConnection() {
    const res = await fetchFromBackend<any>('/api/db-status', { method: 'GET' });
    if (!res.success || !res.data) {
        return {
            success: false,
            connected: false,
            error: res.error || 'Gagal terhubung ke database'
        };
    }
    return res.data;
}
