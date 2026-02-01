// Dummy data untuk Perpres Jaminan Kesehatan
// Data ini menunjukkan perubahan dari Perpres 82/2018 ke Perpres 64/2020

export interface Article {
  id: string;
  number: string; // "Pasal 1", "Pasal 2 ayat (1)"
  content: string;
  status: 'active' | 'modified' | 'deleted' | 'new';
}

export interface RegulationVersion {
  id: string;
  number: string; // "82"
  year: number;
  fullTitle: string;
  effectiveDate: string;
  articles: Article[];
  status: 'active' | 'amended' | 'revoked';
}

export interface Regulation {
  id: string;
  title: string;
  type: string; // "Perpres", "PP", "UU"
  description: string;
  versions: RegulationVersion[];
}

// Data dummy Perpres Jaminan Kesehatan
export const dummyRegulations: Regulation[] = [
  {
    id: "1",
    title: "Jaminan Kesehatan",
    type: "Perpres",
    description: "Peraturan Presiden tentang Jaminan Kesehatan Nasional",
    versions: [
      {
        id: "v1",
        number: "82",
        year: 2018,
        fullTitle: "Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan",
        effectiveDate: "2018-09-17",
        status: "amended",
        articles: [
          {
            id: "a1-v1",
            number: "Pasal 1",
            status: "modified",
            content: `Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah.
2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.
3. Peserta adalah setiap orang, termasuk orang asing yang bekerja paling singkat 6 (enam) bulan di Indonesia, yang telah membayar iuran.`
          },
          {
            id: "a2-v1",
            number: "Pasal 2",
            status: "active",
            content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:
a. kegotongroyongan;
b. nirlaba;
c. keterbukaan;
d. kehati-hatian;
e. akuntabilitas;
f. portabilitas;
g. kepesertaan bersifat wajib;
h. dana amanat; dan
i. hasil pengelolaan dana Jaminan Kesehatan dipergunakan seluruhnya untuk pengembangan program dan untuk sebesar-besar kepentingan Peserta.`
          },
          {
            id: "a3-v1",
            number: "Pasal 3",
            status: "modified",
            content: `(1) Peserta Jaminan Kesehatan meliputi:
a. Penerima Bantuan Iuran Jaminan Kesehatan; dan
b. Bukan Penerima Bantuan Iuran Jaminan Kesehatan.
(2) Peserta sebagaimana dimaksud pada ayat (1) wajib mendaftarkan dirinya dan anggota keluarganya pada BPJS Kesehatan.`
          },
          {
            id: "a4-v1",
            number: "Pasal 4",
            status: "deleted",
            content: `Penerima Bantuan Iuran Jaminan Kesehatan yang selanjutnya disebut PBI Jaminan Kesehatan adalah fakir miskin dan orang tidak mampu sebagai peserta program Jaminan Kesehatan yang iurannya dibayar oleh Pemerintah.`
          },
          {
            id: "a5-v1",
            number: "Pasal 5",
            status: "active",
            content: `(1) Kriteria fakir miskin dan orang tidak mampu ditetapkan oleh menteri yang menyelenggarakan urusan pemerintahan di bidang sosial.
(2) Kriteria fakir miskin dan orang tidak mampu sebagaimana dimaksud pada ayat (1) digunakan sebagai dasar bagi lembaga yang menyelenggarakan urusan pemerintahan di bidang statistik untuk melakukan pendataan.`
          },
          {
            id: "a34-v1",
            number: "Pasal 34",
            status: "modified",
            content: `(1) Iuran Jaminan Kesehatan bagi Peserta Pekerja Penerima Upah yang bekerja pada Lembaga Pemerintahan terdiri atas:
a. 4% (empat persen) dari Gaji atau Upah per bulan dibayar oleh Pemberi Kerja; dan
b. 1% (satu persen) dari Gaji atau Upah per bulan dibayar oleh Peserta.
(2) Iuran sebagaimana dimaksud pada ayat (1) dibayar oleh Pemberi Kerja yang dipotong langsung dari Gaji atau Upah Peserta setiap bulan.`
          }
        ]
      },
      {
        id: "v2",
        number: "75",
        year: 2019,
        fullTitle: "Peraturan Presiden Nomor 75 Tahun 2019 tentang Perubahan atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan",
        effectiveDate: "2019-10-24",
        status: "amended",
        articles: [
          {
            id: "a1-v2",
            number: "Pasal 1",
            status: "modified",
            content: `Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Program Jaminan Kesehatan Nasional adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.
2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.
3. Peserta adalah setiap orang, termasuk orang asing yang bekerja paling singkat 6 (enam) bulan di Indonesia, yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.
4. Fasilitas Kesehatan adalah fasilitas pelayanan kesehatan yang digunakan untuk menyelenggarakan upaya pelayanan kesehatan perorangan, baik promotif, preventif, kuratif maupun rehabilitatif yang dilakukan oleh Pemerintah, Pemerintah Daerah, dan/atau masyarakat.`
          },
          {
            id: "a2-v2",
            number: "Pasal 2",
            status: "active",
            content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:
a. kegotongroyongan;
b. nirlaba;
c. keterbukaan;
d. kehati-hatian;
e. akuntabilitas;
f. portabilitas;
g. kepesertaan bersifat wajib;
h. dana amanat; dan
i. hasil pengelolaan dana Jaminan Kesehatan dipergunakan seluruhnya untuk pengembangan program dan untuk sebesar-besar kepentingan Peserta.`
          },
          {
            id: "a3-v2",
            number: "Pasal 3",
            status: "modified",
            content: `(1) Peserta Jaminan Kesehatan meliputi:
a. Penerima Bantuan Iuran Jaminan Kesehatan yang selanjutnya disebut PBI Jaminan Kesehatan; dan
b. Bukan Penerima Bantuan Iuran Jaminan Kesehatan yang selanjutnya disebut Bukan PBI Jaminan Kesehatan.
(2) Peserta sebagaimana dimaksud pada ayat (1) wajib mendaftarkan dirinya dan anggota keluarganya pada BPJS Kesehatan.
(3) Pendaftaran sebagaimana dimaksud pada ayat (2) dapat dilakukan secara kolektif oleh Pemberi Kerja.`
          },
          {
            id: "a4a-v2",
            number: "Pasal 4A",
            status: "new",
            content: `(1) Peserta PBI Jaminan Kesehatan meliputi orang yang tergolong fakir miskin dan orang tidak mampu.
(2) Kriteria fakir miskin dan orang tidak mampu sebagaimana dimaksud pada ayat (1) ditetapkan oleh menteri yang menyelenggarakan urusan pemerintahan di bidang sosial setelah berkoordinasi dengan Menteri dan menteri/kepala lembaga terkait.`
          },
          {
            id: "a5-v2",
            number: "Pasal 5",
            status: "active",
            content: `(1) Kriteria fakir miskin dan orang tidak mampu ditetapkan oleh menteri yang menyelenggarakan urusan pemerintahan di bidang sosial.
(2) Kriteria fakir miskin dan orang tidak mampu sebagaimana dimaksud pada ayat (1) digunakan sebagai dasar bagi lembaga yang menyelenggarakan urusan pemerintahan di bidang statistik untuk melakukan pendataan.`
          },
          {
            id: "a34-v2",
            number: "Pasal 34",
            status: "modified",
            content: `(1) Iuran Jaminan Kesehatan bagi Peserta Pekerja Penerima Upah yang bekerja pada Lembaga Pemerintahan terdiri atas:
a. 4% (empat persen) dari Gaji atau Upah per bulan dibayar oleh Pemberi Kerja; dan
b. 1% (satu persen) dari Gaji atau Upah per bulan dibayar oleh Peserta.
(2) Batas paling tinggi Gaji atau Upah per bulan yang digunakan sebagai dasar perhitungan besaran Iuran bagi Peserta Pekerja Penerima Upah adalah Rp12.000.000,00 (dua belas juta rupiah).
(3) Iuran sebagaimana dimaksud pada ayat (1) dibayar oleh Pemberi Kerja yang dipotong langsung dari Gaji atau Upah Peserta setiap bulan.`
          }
        ]
      },
      {
        id: "v3",
        number: "64",
        year: 2020,
        fullTitle: "Peraturan Presiden Nomor 64 Tahun 2020 tentang Perubahan Kedua atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan",
        effectiveDate: "2020-05-05",
        status: "active",
        articles: [
          {
            id: "a1-v3",
            number: "Pasal 1",
            status: "active",
            content: `Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Program Jaminan Kesehatan Nasional yang selanjutnya disebut Program JKN adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.
2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.
3. Peserta adalah setiap orang, termasuk orang asing yang bekerja paling singkat 6 (enam) bulan di Indonesia, yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.
4. Fasilitas Kesehatan adalah fasilitas pelayanan kesehatan yang digunakan untuk menyelenggarakan upaya pelayanan kesehatan perorangan, baik promotif, preventif, kuratif maupun rehabilitatif yang dilakukan oleh Pemerintah Pusat, Pemerintah Daerah, dan/atau masyarakat.
5. Manfaat adalah faedah jaminan sosial yang menjadi hak peserta dan/atau anggota keluarganya.`
          },
          {
            id: "a2-v3",
            number: "Pasal 2",
            status: "active",
            content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:
a. kegotongroyongan;
b. nirlaba;
c. keterbukaan;
d. kehati-hatian;
e. akuntabilitas;
f. portabilitas;
g. kepesertaan bersifat wajib;
h. dana amanat; dan
i. hasil pengelolaan dana Jaminan Kesehatan dipergunakan seluruhnya untuk pengembangan program dan untuk sebesar-besar kepentingan Peserta.`
          },
          {
            id: "a3-v3",
            number: "Pasal 3",
            status: "active",
            content: `(1) Peserta Program JKN meliputi:
a. Penerima Bantuan Iuran Jaminan Kesehatan yang selanjutnya disebut PBI Jaminan Kesehatan; dan
b. Bukan Penerima Bantuan Iuran Jaminan Kesehatan yang selanjutnya disebut Bukan PBI Jaminan Kesehatan.
(2) Peserta sebagaimana dimaksud pada ayat (1) wajib mendaftarkan dirinya dan anggota keluarganya pada BPJS Kesehatan.
(3) Pendaftaran sebagaimana dimaksud pada ayat (2) dapat dilakukan secara kolektif oleh Pemberi Kerja.
(4) Peserta sebagaimana dimaksud pada ayat (1) dapat mengikutsertakan anggota keluarga lainnya.`
          },
          {
            id: "a4a-v3",
            number: "Pasal 4A",
            status: "active",
            content: `(1) Peserta PBI Jaminan Kesehatan meliputi orang yang tergolong fakir miskin dan orang tidak mampu.
(2) Kriteria fakir miskin dan orang tidak mampu sebagaimana dimaksud pada ayat (1) ditetapkan oleh menteri yang menyelenggarakan urusan pemerintahan di bidang sosial setelah berkoordinasi dengan Menteri dan menteri/kepala lembaga terkait.
(3) Penetapan kriteria sebagaimana dimaksud pada ayat (2) dilakukan paling sedikit 1 (satu) kali dalam 2 (dua) tahun.`
          },
          {
            id: "a5-v3",
            number: "Pasal 5",
            status: "active",
            content: `(1) Kriteria fakir miskin dan orang tidak mampu ditetapkan oleh menteri yang menyelenggarakan urusan pemerintahan di bidang sosial.
(2) Kriteria fakir miskin dan orang tidak mampu sebagaimana dimaksud pada ayat (1) digunakan sebagai dasar bagi lembaga yang menyelenggarakan urusan pemerintahan di bidang statistik untuk melakukan pendataan.`
          },
          {
            id: "a34-v3",
            number: "Pasal 34",
            status: "active",
            content: `(1) Iuran Jaminan Kesehatan bagi Peserta Pekerja Penerima Upah yang bekerja pada Lembaga Pemerintahan terdiri atas:
a. 4% (empat persen) dari Gaji atau Upah per bulan dibayar oleh Pemberi Kerja; dan
b. 1% (satu persen) dari Gaji atau Upah per bulan dibayar oleh Peserta.
(2) Batas paling tinggi Gaji atau Upah per bulan yang digunakan sebagai dasar perhitungan besaran Iuran bagi Peserta Pekerja Penerima Upah adalah Rp12.000.000,00 (dua belas juta rupiah).
(3) Batas paling rendah Gaji atau Upah per bulan yang digunakan sebagai dasar perhitungan besaran Iuran adalah upah minimum yang berlaku.
(4) Iuran sebagaimana dimaksud pada ayat (1) dibayar oleh Pemberi Kerja yang dipotong langsung dari Gaji atau Upah Peserta setiap bulan.`
          }
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Pengadaan Barang/Jasa Pemerintah",
    type: "Perpres",
    description: "Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah",
    versions: [
      {
        id: "pbj-v1",
        number: "16",
        year: 2018,
        fullTitle: "Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah",
        effectiveDate: "2018-03-22",
        status: "amended",
        articles: []
      },
      {
        id: "pbj-v2",
        number: "12",
        year: 2021,
        fullTitle: "Peraturan Presiden Nomor 12 Tahun 2021 tentang Perubahan atas Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah",
        effectiveDate: "2021-02-02",
        status: "active",
        articles: []
      }
    ]
  }
];

// Helper function untuk mendapatkan versi berdasarkan ID
export function getVersionById(regulationId: string, versionId: string): RegulationVersion | undefined {
  const regulation = dummyRegulations.find(r => r.id === regulationId);
  return regulation?.versions.find(v => v.id === versionId);
}

// Helper function untuk mendapatkan regulation berdasarkan ID
export function getRegulationById(id: string): Regulation | undefined {
  return dummyRegulations.find(r => r.id === id);
}
