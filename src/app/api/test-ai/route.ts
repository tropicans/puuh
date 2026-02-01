import { NextResponse } from 'next/server';
import { testLLMConnection } from '@/lib/ai-service';

export async function GET() {
    try {
        // Debug: log environment variables (remove in production)
        console.log('=== AI Test Debug ===');
        console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET');
        console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || 'NOT SET');
        console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || 'NOT SET');
        console.log('=====================');

        const result = await testLLMConnection();

        return NextResponse.json({
            status: result.success ? 'connected' : 'error',
            model: result.model,
            baseUrl: process.env.OPENAI_BASE_URL,
            apiKeySet: !!process.env.OPENAI_API_KEY,
            error: result.error
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            apiKeySet: !!process.env.OPENAI_API_KEY,
            baseUrl: process.env.OPENAI_BASE_URL
        }, { status: 500 });
    }
}
