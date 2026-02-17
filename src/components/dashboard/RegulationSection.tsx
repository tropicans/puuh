import { RegulationList } from '@/components/regulations/RegulationList';
import { Pagination } from '@/components/common/Pagination';
import { seedInitialData } from '@/actions/regulations';
import { getFilteredRegulations } from '@/lib/data-service';
import { transformRegulation } from '@/lib/transformers';

export async function RegulationSection({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
    const typeId = typeof searchParams?.type === 'string' ? searchParams.type : undefined;
    const yearStr = typeof searchParams?.year === 'string' ? searchParams.year : undefined;
    const year = yearStr ? parseInt(yearStr) : undefined;

    // Pagination
    const pageStr = typeof searchParams?.page === 'string' ? searchParams.page : '1';
    const page = parseInt(pageStr) || 1;
    const pageSize = 10;

    const { regulations: dbRegulations, totalPages } = await getFilteredRegulations({
        q,
        typeId,
        year,
        page,
        pageSize
    });

    const regulations = dbRegulations.map(transformRegulation);

    return (
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
    );
}
