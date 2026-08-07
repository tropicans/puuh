import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST seed initial data (ADMIN only)
router.post('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const existingTypes = await prisma.regulationType.count();
    if (existingTypes > 0) {
      return res.json({ success: true, message: 'Data sudah ada' });
    }

    const perpres = await prisma.regulationType.create({
      data: { name: 'Peraturan Presiden', shortName: 'Perpres' }
    });

    await prisma.regulationType.create({
      data: { name: 'Peraturan Pemerintah', shortName: 'PP' }
    });

    await prisma.regulationType.create({
      data: { name: 'Undang-Undang', shortName: 'UU' }
    });

    await prisma.regulationType.create({
      data: { name: 'Peraturan Menteri', shortName: 'Permen' }
    });

    await prisma.regulationType.create({
      data: { name: 'Peraturan Daerah', shortName: 'Perda' }
    });

    const jkn = await prisma.regulation.create({
      data: {
        title: 'Jaminan Kesehatan',
        description: 'Peraturan Presiden tentang Jaminan Kesehatan Nasional',
        typeId: perpres.id
      }
    });

    const v2018 = await prisma.regulationVersion.create({
      data: {
        regulationId: jkn.id,
        number: '82',
        year: 2018,
        fullTitle: 'Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
        effectiveDate: new Date('2018-09-17'),
        status: 'AMENDED'
      }
    });

    const v2019 = await prisma.regulationVersion.create({
      data: {
        regulationId: jkn.id,
        number: '75',
        year: 2019,
        fullTitle: 'Peraturan Presiden Nomor 75 Tahun 2019 tentang Perubahan atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
        effectiveDate: new Date('2019-10-24'),
        status: 'AMENDED',
        amendsId: v2018.id
      }
    });

    await prisma.regulationVersion.create({
      data: {
        regulationId: jkn.id,
        number: '64',
        year: 2020,
        fullTitle: 'Peraturan Presiden Nomor 64 Tahun 2020 tentang Perubahan Kedua atas Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
        effectiveDate: new Date('2020-05-05'),
        status: 'ACTIVE',
        amendsId: v2019.id
      }
    });

    await prisma.article.createMany({
      data: [
        {
          versionId: v2018.id,
          articleNumber: 'Pasal 1',
          content: `Dalam Peraturan Presiden ini yang dimaksud dengan:\n1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah.\n2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.`,
          status: 'ACTIVE',
          orderIndex: 0
        },
        {
          versionId: v2018.id,
          articleNumber: 'Pasal 2',
          content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:\na. kegotongroyongan;\nb. nirlaba;\nc. keterbukaan;\nd. kehati-hatian;\ne. akuntabilitas;`,
          status: 'ACTIVE',
          orderIndex: 1
        },
        {
          versionId: v2018.id,
          articleNumber: 'Pasal 3',
          content: `Peserta Jaminan Kesehatan terdiri atas:\na. Peserta Penerima Bantuan Iuran (PBI); dan\nb. Peserta bukan Penerima Bantuan Iuran (Non-PBI).`,
          status: 'ACTIVE',
          orderIndex: 2
        }
      ]
    });

    await prisma.article.createMany({
      data: [
        {
          versionId: v2019.id,
          articleNumber: 'Pasal 1',
          content: `Dalam Peraturan Presiden ini yang dimaksud dengan:\n1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah Pusat atau Pemerintah Daerah.\n2. Badan Penyelenggara Jaminan Sosial Kesehatan yang selanjutnya disebut BPJS Kesehatan adalah badan hukum yang dibentuk untuk menyelenggarakan program Jaminan Kesehatan.\n3. Iuran Jaminan Kesehatan adalah sejumlah uang yang dibayarkan secara teratur oleh Peserta, Pemberi Kerja, dan/atau Pemerintah.`,
          status: 'MODIFIED',
          orderIndex: 0
        },
        {
          versionId: v2019.id,
          articleNumber: 'Pasal 2',
          content: `Jaminan Kesehatan diselenggarakan secara nasional berdasarkan prinsip:\na. kegotongroyongan;\nb. nirlaba;\nc. keterbukaan;\nd. kehati-hatian;\ne. akuntabilitas;\nf. portabilitas;\ng. kepesertaan wajib.`,
          status: 'MODIFIED',
          orderIndex: 1
        },
        {
          versionId: v2019.id,
          articleNumber: 'Pasal 3',
          content: `Peserta Jaminan Kesehatan terdiri atas:\na. Peserta Penerima Bantuan Iuran (PBI); dan\nb. Peserta bukan Penerima Bantuan Iuran (Non-PBI).`,
          status: 'ACTIVE',
          orderIndex: 2
        },
        {
          versionId: v2019.id,
          articleNumber: 'Pasal 3A',
          content: `Peserta PBI Jaminan Kesehatan sebagaimana dimaksud dalam Pasal 3 huruf a meliputi orang yang tergolong fakir miskin dan orang tidak mampu.`,
          status: 'NEW',
          orderIndex: 3
        }
      ]
    });

    return res.json({ success: true, message: 'Data berhasil di-seed' });
  } catch (error) {
    logger.error('Error seeding database:', error);
    return res.status(500).json({ success: false, error: 'Failed to seed database' });
  }
});

export default router;
