import { NextRequest, NextResponse } from 'next/server';
import { uploadLimiter } from '@/lib/rate-limit';
import { uploadSchema } from '@/lib/validations';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3007';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Rate Limiting Check
        const { limited } = await uploadLimiter.check(request);
        if (limited) {
            return NextResponse.json(
                { success: false, message: 'Rate limit exceeded. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch (formDataError) {
            const message = formDataError instanceof Error ? formDataError.message : 'Gagal membaca form data upload.';
            const normalizedMessage = message.toLowerCase();
            const isBodyTooLarge =
                normalizedMessage.includes('too large') ||
                normalizedMessage.includes('payload too large') ||
                normalizedMessage.includes('request entity too large') ||
                normalizedMessage.includes('content length') ||
                normalizedMessage.includes('size limit') ||
                normalizedMessage.includes('file too large');

            return NextResponse.json(
                {
                    success: false,
                    message: isBodyTooLarge
                        ? 'Ukuran request terlalu besar. Maksimum upload 20MB per file.'
                        : 'Format upload tidak valid. Coba upload ulang file PDF.'
                },
                { status: isBodyTooLarge ? 413 : 400 }
            );
        }

        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: `File harus diupload.` },
                { status: 400 }
            );
        }

        // MIME type and file extension validation
        const ALLOWED_MIMES = ['application/pdf'];
        if (!ALLOWED_MIMES.includes(file.type)) {
            return NextResponse.json({
                success: false,
                message: 'Hanya file PDF yang diterima.'
            }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            return NextResponse.json({
                success: false,
                message: 'Ekstensi file harus .pdf.'
            }, { status: 400 });
        }

        // Zod Validation
        const result = uploadSchema.safeParse({
            regulationType: formData.get('regulationType'),
            number: formData.get('number'),
            year: formData.get('year'),
            title: formData.get('title') || undefined,
            existingRegulationId: formData.get('existingRegulationId') || undefined,
        });

        if (!result.success) {
            const errorMsg = result.error.issues.map((e) => e.message).join(', ');
            return NextResponse.json(
                { success: false, message: `Validation Error: ${errorMsg}` },
                { status: 400 }
            );
        }

        // Build backend FormData
        const backendFormData = new FormData();
        backendFormData.append('file', file);
        backendFormData.append('regulationType', result.data.regulationType);
        backendFormData.append('number', result.data.number);
        backendFormData.append('year', result.data.year);
        if (result.data.title) {
            backendFormData.append('title', result.data.title);
        }
        if (result.data.existingRegulationId) {
            backendFormData.append('existingRegulationId', result.data.existingRegulationId);
        }

        console.log(`Forwarding upload stream to Express backend: ${file.name}`);

        const response = await fetch(`${BACKEND_URL}/api/upload`, {
            method: 'POST',
            body: backendFormData,
            headers: {
                'X-User-Id': user.id,
                'X-User-Role': user.role,
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || data.error || `HTTP Error ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 202 });

    } catch (error) {
        console.error('Upload init error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menginisialisasi upload'
        }, { status: 500 });
    }
}
