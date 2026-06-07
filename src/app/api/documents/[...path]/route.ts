import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Readable } from 'stream';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;
        if (!path || path.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Document path is required' },
                { status: 400 }
            );
        }

        // Join the path segments to get the correct object key in MinIO
        // e.g. ["regulations", "2026", "UU_1_123.pdf"] -> "regulations/2026/UU_1_123.pdf"
        const filename = path.join('/');

        // Fetch the object stream from MinIO using the existing storage helper
        const nodeStream = await storage.getFileStream(filename);

        // Convert the Node.js Readable stream to a Web ReadableStream
        const webStream = Readable.toWeb(nodeStream);

        // Determine content-disposition and content-type
        const baseName = path[path.length - 1];

        return new Response(webStream as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(baseName)}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error proxying document download from MinIO:', error);
        
        // Handle file not found (MinIO NoSuchKey/NoSuchBucket errors)
        const err = error as { code?: string };
        if (err.code === 'NoSuchKey' || err.code === 'NoSuchBucket') {
            return NextResponse.json(
                { success: false, error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to retrieve document' },
            { status: 500 }
        );
    }
}
