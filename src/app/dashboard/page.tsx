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

export default async function DashboardPage(props: {
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
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 md:p-8">
        <div className="space-y-5 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Area Kerja Regulasi
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Dashboard Perbandingan Regulasi</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
            Telusuri perubahan pasal lintas versi, cari regulasi lebih cepat, dan siapkan analisis untuk kebutuhan legal,
            compliance, dan kebijakan.
          </p>
          <UnifiedSearchBar types={types} years={years} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/70">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-foreground">{regulations.length}</div>
              <div className="text-muted-foreground">Peraturan</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-foreground">{totalVersions}</div>
              <div className="text-muted-foreground">Versi</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-foreground">{totalArticles}</div>
              <div className="text-muted-foreground">Pasal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Cara Kerja</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              { icon: '📤', title: 'Upload', desc: 'Unggah PDF regulasi' },
              { icon: '🔍', title: 'Parse', desc: 'Ekstraksi pasal otomatis' },
              { icon: '⚖️', title: 'Bandingkan', desc: 'Diff antar versi' },
              { icon: '✅', title: 'Review', desc: 'Validasi hasil analisis' },
            ].map((step, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-xl">{step.icon}</p>
                <h3 className="mt-2 font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Legenda Perubahan</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="rounded bg-emerald-500/20 px-3 py-1 font-mono text-sm text-emerald-300">Teks baru</div>
              <span className="text-muted-foreground">= Ditambahkan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded bg-red-500/20 px-3 py-1 font-mono text-sm text-red-300 line-through">Teks lama</div>
              <span className="text-muted-foreground">= Dihapus</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded bg-muted px-3 py-1 font-mono text-sm text-foreground">Teks sama</div>
              <span className="text-muted-foreground">= Tidak berubah</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-6 text-2xl font-bold text-foreground">Daftar Peraturan</h2>
        {regulations.length > 0 ? (
          <>
            <RegulationList regulations={regulations} />
            <Pagination currentPage={page} totalPages={totalPages || 1} />
          </>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card/60 p-12 text-center">
            <div className="mb-4 text-5xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Belum Ada Peraturan</h3>
            <p className="mb-6 text-muted-foreground">Upload peraturan pertama Anda untuk memulai perbandingan.</p>
            <div className="flex justify-center gap-4">
              <a href="/upload" className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                📤 Upload Peraturan
              </a>
              <form
                action={async () => {
                  'use server';
                  await seedInitialData();
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-border/70 bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
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
