'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Types for error handling
interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ==================== Regulation Types ====================

export async function getRegulationTypes(): Promise<ActionResult<Awaited<ReturnType<typeof prisma.regulationType.findMany>>>> {
    try {
        const types = await prisma.regulationType.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: types };
    } catch (error) {
        console.error('Error fetching regulation types:', error);
        return { success: false, error: 'Gagal mengambil jenis peraturan' };
    }
}

export async function createRegulationType(data: { name: string; shortName: string }) {
    try {
        const type = await prisma.regulationType.create({
            data
        });
        revalidatePath('/');
        return { success: true, data: type };
    } catch (error) {
        console.error('Error creating regulation type:', error);
        return { success: false, error: 'Gagal membuat jenis peraturan' };
    }
}

// ==================== Regulations ====================

export async function getRegulations() {
    try {
        const regulations = await prisma.regulation.findMany({
            include: {
                type: true,
                versions: {
                    orderBy: { year: 'asc' },
                    include: {
                        _count: { select: { articles: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: regulations };
    } catch (error) {
        console.error('Error fetching regulations:', error);
        return { success: false, error: 'Gagal mengambil daftar peraturan' };
    }
}

export async function getRegulationById(id: string) {
    try {
        const regulation = await prisma.regulation.findUnique({
            where: { id },
            include: {
                type: true,
                versions: {
                    orderBy: { year: 'asc' },
                    include: {
                        articles: {
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                }
            }
        });

        if (!regulation) {
            return { success: false, error: 'Peraturan tidak ditemukan' };
        }

        return { success: true, data: regulation };
    } catch (error) {
        console.error('Error fetching regulation:', error);
        return { success: false, error: 'Gagal mengambil detail peraturan' };
    }
}

export async function createRegulation(data: {
    title: string;
    description?: string;
    typeId: string;
}) {
    try {
        const regulation = await prisma.regulation.create({
            data,
            include: { type: true }
        });
        revalidatePath('/');
        return { success: true, data: regulation };
    } catch (error) {
        console.error('Error creating regulation:', error);
        return { success: false, error: 'Gagal membuat peraturan' };
    }
}

export async function deleteRegulation(id: string) {
    try {
        await prisma.regulation.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting regulation:', error);
        return { success: false, error: 'Gagal menghapus peraturan' };
    }
}

// ==================== Regulation Versions ====================

export async function getVersionById(id: string) {
    try {
        const version = await prisma.regulationVersion.findUnique({
            where: { id },
            include: {
                regulation: { include: { type: true } },
                articles: { orderBy: { orderIndex: 'asc' } }
            }
        });

        if (!version) {
            return { success: false, error: 'Versi tidak ditemukan' };
        }

        return { success: true, data: version };
    } catch (error) {
        console.error('Error fetching version:', error);
        return { success: false, error: 'Gagal mengambil detail versi' };
    }
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
    try {
        // Jika ini adalah amandemen, update status versi sebelumnya
        if (data.amendsId) {
            await prisma.regulationVersion.update({
                where: { id: data.amendsId },
                data: { status: 'AMENDED' }
            });
        }

        const version = await prisma.regulationVersion.create({
            data: {
                ...data,
                status: 'ACTIVE'
            },
            include: {
                regulation: true
            }
        });

        revalidatePath('/');
        revalidatePath(`/regulations/${data.regulationId}`);
        return { success: true, data: version };
    } catch (error) {
        console.error('Error creating version:', error);
        return { success: false, error: 'Gagal membuat versi baru' };
    }
}

export async function updateVersionStatus(id: string, status: 'ACTIVE' | 'AMENDED' | 'REVOKED') {
    try {
        const version = await prisma.regulationVersion.update({
            where: { id },
            data: { status }
        });
        revalidatePath('/');
        return { success: true, data: version };
    } catch (error) {
        console.error('Error updating version status:', error);
        return { success: false, error: 'Gagal mengubah status versi' };
    }
}

// ==================== Articles ====================

export async function getArticlesByVersionId(versionId: string) {
    try {
        const articles = await prisma.article.findMany({
            where: { versionId },
            orderBy: { orderIndex: 'asc' },
            include: {
                changes: true
            }
        });
        return { success: true, data: articles };
    } catch (error) {
        console.error('Error fetching articles:', error);
        return { success: false, error: 'Gagal mengambil daftar pasal' };
    }
}

export async function createArticles(versionId: string, articles: {
    articleNumber: string;
    content: string;
    status?: 'ACTIVE' | 'MODIFIED' | 'DELETED' | 'NEW';
}[]) {
    try {
        // Delete existing articles first
        await prisma.article.deleteMany({ where: { versionId } });

        // Create new articles
        const createdArticles = await prisma.article.createMany({
            data: articles.map((article, index) => ({
                versionId,
                articleNumber: article.articleNumber,
                content: article.content,
                status: article.status || 'ACTIVE',
                orderIndex: index
            }))
        });

        revalidatePath('/');
        return { success: true, data: createdArticles };
    } catch (error) {
        console.error('Error creating articles:', error);
        return { success: false, error: 'Gagal membuat pasal' };
    }
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
    try {
        const change = await prisma.articleChange.create({ data });
        return { success: true, data: change };
    } catch (error) {
        console.error('Error creating article change:', error);
        return { success: false, error: 'Gagal mencatat perubahan pasal' };
    }
}

// ==================== Seeds ====================

export async function seedInitialData() {
    try {
        // Check if data already exists
        const existingTypes = await prisma.regulationType.count();
        if (existingTypes > 0) {
            return { success: true, message: 'Data sudah ada' };
        }

        // Create regulation types
        const perpres = await prisma.regulationType.create({
            data: { name: 'Peraturan Presiden', shortName: 'Perpres' }
        });

        await prisma.regulationType.create({
            data: { name: 'Peraturan Pemerintah', shortName: 'PP' }
        });

        await prisma.regulationType.create({
            data: { name: 'Undang-Undang', shortName: 'UU' }
        });

        await prisma.regulationType.create({
            data: { name: 'Peraturan Menteri', shortName: 'Permen' }
        });

        await prisma.regulationType.create({
            data: { name: 'Peraturan Daerah', shortName: 'Perda' }
        });

        // Create sample regulation
        const jkn = await prisma.regulation.create({
            data: {
                title: 'Jaminan Kesehatan',
                description: 'Peraturan Presiden tentang Jaminan Kesehatan Nasional',
                typeId: perpres.id
            }
        });

        // Create versions
        const v2018 = await prisma.regulationVersion.create({
            data: {
                regulationId: jkn.id,
                number: '82',
                year: 2018,
                fullTitle: 'Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
                effectiveDate: new Date('2018-09-17'),
                status: 'AMENDED'
            }
        });

        const v2019 = await prisma.regulationVersion.create({
            data: {
                regulationId: jkn.id,
                number: '75',
                year: 2019,
                fullTitle: 'Peraturan Presiden Nomor 75 Tahun 2019 tentang Perubahan atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
                effectiveDate: new Date('2019-10-24'),
                status: 'AMENDED',
                amendsId: v2018.id
            }
        });

        await prisma.regulationVersion.create({
            data: {
                regulationId: jkn.id,
                number: '64',
                year: 2020,
                fullTitle: 'Peraturan Presiden Nomor 64 Tahun 2020 tentang Perubahan Kedua atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
                effectiveDate: new Date('2020-05-05'),
                status: 'ACTIVE',
                amendsId: v2019.id
            }
        });

        // Create sample articles for v2018
        await prisma.article.createMany({
            data: [
                {
                    versionId: v2018.id,
                    articleNumber: 'Pasal 1',
                    content: `Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah.
2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.`,
                    status: 'ACTIVE',
                    orderIndex: 0
                },
                {
                    versionId: v2018.id,
                    articleNumber: 'Pasal 2',
                    content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:
a. kegotongroyongan;
b. nirlaba;
c. keterbukaan;
d. kehati-hatian;
e. akuntabilitas;`,
                    status: 'ACTIVE',
                    orderIndex: 1
                },
                {
                    versionId: v2018.id,
                    articleNumber: 'Pasal 3',
                    content: `Peserta Jaminan Kesehatan terdiri atas:
a. Peserta Penerima Bantuan Iuran (PBI); dan
b. Peserta bukan Penerima Bantuan Iuran (Non-PBI).`,
                    status: 'ACTIVE',
                    orderIndex: 2
                }
            ]
        });

        // Create sample articles for v2019 with some changes
        await prisma.article.createMany({
            data: [
                {
                    versionId: v2019.id,
                    articleNumber: 'Pasal 1',
                    content: `Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.
2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.
3. Iuran Jaminan Kesehatan adalah sejumlah uang yang dibayarkan secara teratur oleh Peserta, Pemberi Kerja, dan/atau Pemerintah.`,
                    status: 'MODIFIED',
                    orderIndex: 0
                },
                {
                    versionId: v2019.id,
                    articleNumber: 'Pasal 2',
                    content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:
a. kegotongroyongan;
b. nirlaba;
c. keterbukaan;
d. kehati-hatian;
e. akuntabilitas;
f. portabilitas;
g. kepesertaan wajib.`,
                    status: 'MODIFIED',
                    orderIndex: 1
                },
                {
                    versionId: v2019.id,
                    articleNumber: 'Pasal 3',
                    content: `Peserta Jaminan Kesehatan terdiri atas:
a. Peserta Penerima Bantuan Iuran (PBI); dan
b. Peserta bukan Penerima Bantuan Iuran (Non-PBI).`,
                    status: 'ACTIVE',
                    orderIndex: 2
                },
                {
                    versionId: v2019.id,
                    articleNumber: 'Pasal 3A',
                    content: `Peserta PBI Jaminan Kesehatan sebagaimana dimaksud dalam Pasal 3 huruf a meliputi orang yang tergolong fakir miskin dan orang tidak mampu.`,
                    status: 'NEW',
                    orderIndex: 3
                }
            ]
        });

        revalidatePath('/');
        return { success: true, message: 'Data berhasil di-seed' };
    } catch (error) {
        console.error('Error seeding data:', error);
        return { success: false, error: 'Gagal membuat data awal' };
    }
}

// ==================== Database Status ====================

export async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        const regulationCount = await prisma.regulation.count();
        const versionCount = await prisma.regulationVersion.count();
        const articleCount = await prisma.article.count();

        return {
            success: true,
            connected: true,
            stats: {
                regulations: regulationCount,
                versions: versionCount,
                articles: articleCount
            }
        };
    } catch (error) {
        console.error('Database connection error:', error);
        return {
            success: false,
            connected: false,
            error: error instanceof Error ? error.message : 'Gagal terhubung ke database'
        };
    }
}
