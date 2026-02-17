'use client';

import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type UploadMode = 'auto' | 'url' | 'manual';

function DropZone({ file, onFileSelect }: { file: File | null; onFileSelect: (f: File | null) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            onFileSelect(droppedFile);
        }
    }, [onFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">File PDF *</label>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${isDragging
                    ? 'border-primary bg-primary/10'
                    : file
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-border/70 bg-background hover:border-primary/50 hover:bg-primary/5'
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                />
                {file ? (
                    <>
                        <div className="mb-2 text-3xl">📄</div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB — Klik untuk mengganti
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mb-2 text-3xl">📤</div>
                        <p className="text-sm font-medium text-foreground">
                            {isDragging ? 'Lepaskan file di sini' : 'Seret file PDF ke sini'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            atau klik untuk memilih file
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

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
        setStatusMessage('Memulai pencarian...');
        setResult(null);

        try {
            const body = { ...formData, existingRegulationId: amendsId };
            const res = await fetch('/api/regulations/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.body) throw new Error('No response stream');

            // Handle Streaming Response
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

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
                            setResult({
                                success: true,
                                message: data.data.message,
                                articlesCount: data.data.parsedArticles,
                                sourceUrl: data.data.sourceUrl
                            });
                            setFormData({ ...formData, number: '', year: '', title: '' });
                        } else if (data.type === 'error') {
                            setResult({ success: false, message: data.message });
                        }
                    } catch {
                        // Ignore parsing errors for partial chunks
                    }
                }
            }
        } catch (error) {
            setResult({ success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
        }
        setLoading(false);
        setStatusMessage('');
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
        <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
            <div>
                <a href={amendsId ? `/regulations/${amendsId}` : "/dashboard"} className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">← Kembali</a>
                <h1 className="mb-2 text-3xl font-bold text-foreground">
                    {amendsId ? '➕ Tambah Versi Baru' : '➕ Tambah Peraturan'}
                </h1>

                {amendsId && existingTitle && (
                    <div className="mb-6 mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
                        <div className="mb-1 text-sm font-medium text-primary">Menambahkan versi untuk:</div>
                        <div className="text-lg font-semibold text-foreground">{decodeURIComponent(existingTitle)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Versi baru ini akan ditambahkan ke timeline regulasi tersebut.</div>
                    </div>
                )}

                {!amendsId && (
                    <p className="text-muted-foreground">Pilih metode untuk menambahkan peraturan</p>
                )}
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 rounded-lg border border-border/60 bg-card/70 p-1">
                <button
                    onClick={() => setMode('auto')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === 'auto' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >🔍 Auto Cari</button>
                <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >📄 Upload PDF</button>
            </div>

            <Card className="border-border/70 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">
                        {mode === 'auto' && '🔍 Cari Otomatis dari JDIH'}
                        {mode === 'manual' && '📄 Upload File PDF'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={mode === 'auto' ? handleAutoFetch : handleManualUpload} className="space-y-4">
                        {/* Type Selector */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Jenis Peraturan</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground focus:ring-2 focus:ring-primary"
                            >
                                <option value="Perpres">Peraturan Presiden (Perpres)</option>
                                <option value="PP">Peraturan Pemerintah (PP)</option>
                                <option value="UU">Undang-Undang (UU)</option>
                                <option value="Permen">Peraturan Menteri</option>
                                <option value="Permendagri">Peraturan Menteri Dalam Negeri</option>
                                <option value="Permenkes">Peraturan Menteri Kesehatan</option>
                                <option value="Kepres">Keputusan Presiden (Kepres)</option>
                                <option value="Inpres">Instruksi Presiden (Inpres)</option>
                                <option value="Perda">Peraturan Daerah</option>
                            </select>
                        </div>

                        {/* Number and Year */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Nomor *</label>
                                <input
                                    type="text"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    placeholder="82"
                                    className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground placeholder:text-muted-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Tahun *</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="2018"
                                    min="1945" max="2030"
                                    className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground placeholder:text-muted-foreground"
                                    required
                                />
                            </div>
                        </div>

                        {/* Title (optional) */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">Judul (opsional)</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Jaminan Kesehatan"
                                className="w-full rounded-lg border border-border/70 bg-background p-3 text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {mode === 'manual' && (
                            <DropZone file={file} onFileSelect={setFile} />
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-lg"
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
                        <div className={`mt-6 rounded-lg p-4 ${result.success ? 'border border-emerald-500/30 bg-emerald-500/10' : 'border border-red-500/30 bg-red-500/10'}`}>
                            <div className={`font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {result.success ? '✅ Berhasil!' : '❌ Gagal'}
                            </div>
                            <div className={`text-sm mt-1 ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>{result.message}</div>
                            {result.success && result.articlesCount !== undefined && (
                                <div className="mt-2 text-sm text-muted-foreground">📄 Pasal diekstrak: <span className="text-foreground">{result.articlesCount}</span></div>
                            )}
                            {result.success && result.sourceUrl && (
                                <div className="mt-1 text-sm text-muted-foreground">🔗 <a href={result.sourceUrl} target="_blank" className="break-all text-primary hover:underline">{result.sourceUrl}</a></div>
                            )}
                            {result.success && amendsId && (
                                <div className="mt-3">
                                    <a href={`/regulations/${amendsId}`} className="text-sm text-primary underline hover:text-primary/80">
                                        → Kembali ke Regulasi
                                    </a>
                                </div>
                            )}
                            {!result.success && mode === 'auto' && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => setMode('manual')}
                                        className="text-sm text-primary underline hover:text-primary/80"
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
            <Card className="border-border/70 bg-card/50">
                <CardContent className="py-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">ℹ️ {mode === 'auto' ? 'Auto Cari:' : 'Upload Manual:'}</div>
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
