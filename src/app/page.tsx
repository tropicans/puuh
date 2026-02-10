import { RegulationList } from '@/components/regulations/RegulationList';
import { Card, CardContent } from '@/components/ui/card';
import { seedInitialData } from '@/actions/regulations';
import { UnifiedSearchBar } from '@/components/search/UnifiedSearchBar';
import { Pagination } from '@/components/common/Pagination';
import { getFilteredRegulations, getFilterOptions } from '@/lib/data-service';
import type { Regulation } from '@/lib/dummy-data';

// ... transformRegulation function (keep as is) ...

// Transform database regulation to match component interface
function transformRegulation(reg: {
  id: string;
  title: string;
  description: string | null;
  type: { name: string; shortName: string };
  versions: Array<{
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    status: string;
    effectiveDate: Date | null;
    pdfPath: string | null;
    articles: Array<{
      id: string;
      articleNumber: string;
      content: string;
      status: string;
    }>;
  }>;
}) {
  return {
    id: reg.id,
    title: reg.title,
    type: reg.type.shortName,
    description: reg.description || '',
    versions: reg.versions.map(v => ({
      id: v.id,
      number: v.number,
      year: v.year,
      fullTitle: v.fullTitle,
      status: v.status.toLowerCase() as 'active' | 'amended' | 'revoked',
      effectiveDate: v.effectiveDate?.toISOString() || '',
      pdfPath: v.pdfPath || undefined,
      articles: v.articles.map(a => ({
        id: a.id,
        number: a.articleNumber,
        content: a.content,
        status: a.status.toLowerCase() as 'active' | 'modified' | 'deleted' | 'new'
      }))
    }))
  };
}

export default async function HomePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const typeId = typeof searchParams?.type === 'string' ? searchParams.type : undefined;
  const yearStr = typeof searchParams?.year === 'string' ? searchParams.year : undefined;
  const year = yearStr ? parseInt(yearStr) : undefined;

  // Pagination
  const pageStr = typeof searchParams?.page === 'string' ? searchParams.page : '1';
  const page = parseInt(pageStr) || 1;
  const pageSize = 10;

  // Fetch data via service
  const { types, years } = await getFilterOptions();
  const { regulations: dbRegulations, totalPages } = await getFilteredRegulations({
    q,
    typeId,
    year,
    page,
    pageSize
  });

  const regulations: Regulation[] = dbRegulations.map(transformRegulation);
  const totalVersions = regulations.reduce((sum, r) => sum + r.versions.length, 0);
  const totalArticles = regulations.reduce(
    (sum, r) => sum + r.versions.reduce((vs, v) => vs + v.articles.length, 0),
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero section */}
      <div className="relative text-center py-16 md:py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDuration: '10s' }} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4 animate-fade-in">
            Powered by AI Verbatim Diff
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-[1.1]">
            <span className="gradient-text">Perbandingan Peraturan</span>
            <br />
            <span className="text-white drop-shadow-sm">Secara Verbatim</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed px-4">
            Bandingkan peraturan perundang-undangan dari waktu ke waktu.
            Lihat pasal mana yang masih berlaku, diubah, atau dicabut dengan tracing visual yang cerdas.
          </p>

          <UnifiedSearchBar types={types} years={years} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {regulations.length}
              </div>
              <div className="text-gray-400">Peraturan</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {totalVersions}
              </div>
              <div className="text-gray-400">Versi</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border-pink-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {totalArticles}
              </div>
              <div className="text-gray-400">Pasal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          🎯 Cara Kerja
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '📤', title: 'Upload', desc: 'Upload PDF peraturan' },
            { icon: '🔍', title: 'Parse', desc: 'AI ekstrak pasal-pasal' },
            { icon: '⚖️', title: 'Bandingkan', desc: 'Bandingkan versi' },
            { icon: '✨', title: 'Lihat Diff', desc: 'Verbatim highlighting' },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl"
            >
              <span className="text-2xl">{step.icon}</span>
              <div>
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diff legend */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          🎨 Legenda Warna
        </h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-emerald-500/30 text-emerald-300 rounded text-sm font-mono">
              Teks baru
            </div>
            <span className="text-gray-400">= Ditambahkan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-red-500/30 text-red-300 line-through rounded text-sm font-mono">
              Teks lama
            </div>
            <span className="text-gray-400">= Dihapus</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm font-mono">
              Teks sama
            </div>
            <span className="text-gray-400">= Tidak berubah</span>
          </div>
        </div>
      </div>

      {/* Regulation list */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          📚 Daftar Peraturan
        </h2>
        {regulations.length > 0 ? (
          <>
            <RegulationList regulations={regulations} />
            <Pagination currentPage={page} totalPages={totalPages || 1} />
          </>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Belum Ada Peraturan
            </h3>
            <p className="text-gray-400 mb-6">
              Upload peraturan pertama Anda untuk memulai perbandingan
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/upload"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
              >
                📤 Upload Peraturan
              </a>
              <form action={async () => {
                'use server';
                await seedInitialData();
              }}>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  🌱 Load Sample Data
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
