'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type UploadMode = 'auto' | 'url' | 'manual';

function UploadContent() {
    const searchParams = useSearchParams();
    const amendsId = searchParams.get('amends');
    const existingTitle = searchParams.get('title');

    const [mode, setMode] = useState<UploadMode>('auto');
    const [formData, setFormData] = useState({
        type: 'Perpres',
        number: '',
        year: '',
        title: '',
        url: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        articlesCount?: number;
        sourceUrl?: string;
    } | null>(null);

    // Set initial mode to manual if adding version (usually we have the file)
    useEffect(() => {
        if (amendsId) {
            setMode('manual');
        }
    }, [amendsId]);

    const handleAutoFetch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.number || !formData.year) {
            setResult({ success: false, message: 'Nomor dan tahun wajib diisi' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const body = { ...formData, existingRegulationId: amendsId };
            const res = await fetch('/api/regulations/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            setResult({
                success: data.success,
                message: data.message,
                articlesCount: data.articlesCount,
                sourceUrl: data.sourceUrl
            });
            if (data.success) {
                setFormData({ ...formData, number: '', year: '', title: '' });
            }
        } catch (error) {
            setResult({ success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
        }
        setLoading(false);
    };

    const [statusMessage, setStatusMessage] = useState('');

    const handleManualUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !formData.number || !formData.year) {
            setResult({ success: false, message: 'File, nomor dan tahun wajib diisi' });
            return;
        }

        setLoading(true);
        setStatusMessage('Memulai upload...');
        setResult(null);

        const form = new FormData();
        form.append('file', file);
        form.append('regulationType', formData.type);
        form.append('title', formData.title || `${formData.type} ${formData.number}/${formData.year}`);
        form.append('number', formData.number);
        form.append('year', formData.year);

        if (amendsId) {
            form.append('existingRegulationId', amendsId);
        }

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: form });

            if (!res.body) throw new Error('No response stream');

            // Handle Streaming Response
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let finalResult = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.type === 'progress') {
                            setStatusMessage(data.message);
                        } else if (data.type === 'success') {
                            finalResult = data.data;
                            setResult({
                                success: true,
                                message: data.data.message,
                                articlesCount: data.data.parsedArticles
                            });
                        } else if (data.type === 'error') {
                            throw new Error(data.message);
                        }
                    } catch (e) {
                        // Ignore parsing errors for partial chunks or errors
                        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                            // potential real error handling if needed
                        }
                    }
                }
            }

            if (finalResult) {
                setFile(null);
                setFormData({ ...formData, number: '', year: '', title: '' });
            }

        } catch (error) {
            setResult({ success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
        }
        setLoading(false);
        setStatusMessage('');
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div>
                <a href={amendsId ? `/regulations/${amendsId}` : "/"} className="text-gray-400 hover:text-white text-sm mb-4 inline-block">← Kembali</a>
                <h1 className="text-3xl font-bold text-white mb-2">
                    {amendsId ? '➕ Tambah Versi Baru' : '➕ Tambah Peraturan'}
                </h1>

                {amendsId && existingTitle && (
                    <div className="bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-lg mt-4 mb-6">
                        <div className="text-indigo-300 text-sm font-medium mb-1">Menambahkan versi untuk:</div>
                        <div className="text-white text-lg font-semibold">{decodeURIComponent(existingTitle)}</div>
                        <div className="text-indigo-400/80 text-xs mt-1">Versi baru ini akan ditambahkan ke timeline regulasi tersebut.</div>
                    </div>
                )}

                {!amendsId && (
                    <p className="text-gray-400">Pilih metode untuk menambahkan peraturan</p>
                )}
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
                <button
                    onClick={() => setMode('auto')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'auto' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >🔍 Auto Cari</button>
                <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >📄 Upload PDF</button>
            </div>

            <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">
                        {mode === 'auto' && '🔍 Cari Otomatis dari JDIH'}
                        {mode === 'manual' && '📄 Upload File PDF'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={mode === 'auto' ? handleAutoFetch : handleManualUpload} className="space-y-4">
                        {/* Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Jenis Peraturan</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Perpres">Peraturan Presiden (Perpres)</option>
                                <option value="PP">Peraturan Pemerintah (PP)</option>
                                <option value="UU">Undang-Undang (UU)</option>
                                <option value="Permen">Peraturan Menteri</option>
                                <option value="Perda">Peraturan Daerah</option>
                            </select>
                        </div>

                        {/* Number and Year */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Nomor *</label>
                                <input
                                    type="text"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    placeholder="82"
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Tahun *</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="2018"
                                    min="1945" max="2030"
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Title (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Judul (opsional)</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Jaminan Kesehatan"
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                            />
                        </div>

                        {/* Manual upload: File input */}
                        {mode === 'manual' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">File PDF *</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
                                    required
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-6 text-lg ${amendsId ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {statusMessage || 'Memproses...'}
                                </span>
                            ) : (
                                mode === 'auto'
                                    ? (amendsId ? '🔍 Cari & Tambah Versi' : '🔍 Cari & Tambahkan')
                                    : (amendsId ? '📥 Upload & Tambah Versi' : '📥 Upload & Parse')
                            )}
                        </Button>
                    </form>

                    {/* Result */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            <div className={`font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {result.success ? '✅ Berhasil!' : '❌ Gagal'}
                            </div>
                            <div className={`text-sm mt-1 ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>{result.message}</div>
                            {result.success && result.articlesCount !== undefined && (
                                <div className="mt-2 text-sm text-gray-400">📄 Pasal diekstrak: <span className="text-white">{result.articlesCount}</span></div>
                            )}
                            {result.success && result.sourceUrl && (
                                <div className="mt-1 text-sm text-gray-400">🔗 <a href={result.sourceUrl} target="_blank" className="text-indigo-400 hover:underline break-all">{result.sourceUrl}</a></div>
                            )}
                            {result.success && amendsId && (
                                <div className="mt-3">
                                    <a href={`/regulations/${amendsId}`} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
                                        → Kembali ke Regulasi
                                    </a>
                                </div>
                            )}
                            {!result.success && mode === 'auto' && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => setMode('manual')}
                                        className="text-sm text-indigo-400 hover:text-indigo-300 underline"
                                    >
                                        → Coba upload PDF secara manual
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-gray-900/30 border-gray-800">
                <CardContent className="py-4">
                    <div className="text-sm text-gray-400 space-y-2">
                        <div className="font-medium text-white">ℹ️ {mode === 'auto' ? 'Auto Cari:' : 'Upload Manual:'}</div>
                        {mode === 'auto' ? (
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Masukkan jenis, nomor, dan tahun</li>
                                <li>Aplikasi mencari di JDIH (peraturan.bpk.go.id, setkab, dll)</li>
                                <li>PDF didownload dan teks diekstrak otomatis</li>
                                <li>Jika gagal, gunakan Upload PDF manual</li>
                            </ol>
                        ) : (
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Download PDF dari sumber terpercaya (JDIH)</li>
                                <li>Upload file PDF di form ini</li>
                                <li>Teks diekstrak dengan pdf-parse / OCR</li>
                                <li>AI mengekstrak pasal-pasal secara otomatis</li>
                            </ol>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function UploadPage() {
    return (
        <Suspense fallback={<div className="text-white p-8 text-center animate-pulse">Memuat form upload...</div>}>
            <UploadContent />
        </Suspense>
    );
}
