import { Card, CardContent } from '@/components/ui/card';
import { getFilteredRegulations } from '@/lib/data-service';
import { transformRegulation } from '@/lib/transformers';

export async function StatsSection({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
    const typeId = typeof searchParams?.type === 'string' ? searchParams.type : undefined;
    const yearStr = typeof searchParams?.year === 'string' ? searchParams.year : undefined;
    const year = yearStr ? parseInt(yearStr) : undefined;

    const pageStr = typeof searchParams?.page === 'string' ? searchParams.page : '1';
    const currentPage = parseInt(pageStr) || 1;
    const pageSize = 10;

    const { regulations: dbRegulations, totalCount } = await getFilteredRegulations({
        q,
        typeId,
        year,
        page: currentPage,
        pageSize
    });

    const regulations = dbRegulations.map(transformRegulation);

    const totalVersions = regulations.reduce((sum, r) => sum + r.versions.length, 0);
    const totalArticles = regulations.reduce(
        (sum, r) => sum + r.versions.reduce((versionSum, v) => versionSum + v.articles.length, 0),
        0
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-1">
                            {totalCount}
                        </div>
                        <div className="text-gray-400">Total Peraturan</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-1">
                            {totalVersions}
                        </div>
                        <div className="text-gray-400">Versi (Halaman Ini)</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border-pink-500/30">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-1">
                            {totalArticles}
                        </div>
                        <div className="text-gray-400">Pasal (Halaman Ini)</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
