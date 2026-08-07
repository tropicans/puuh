import { Router, Request, Response } from 'express';
import { hash } from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const MIN_BOOTSTRAP_PASSWORD_LENGTH = 12;

// POST seed/bootstrap admin user if no users exist
router.post('/seed-admin', async (req: Request, res: Response) => {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return res.json({
        success: true,
        message: `Already have ${existingUsers} user(s) in database`
      });
    }

    const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@puu.local';
    const bootstrapAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin12345678';

    if (bootstrapAdminPassword.length < MIN_BOOTSTRAP_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `BOOTSTRAP_ADMIN_PASSWORD minimal ${MIN_BOOTSTRAP_PASSWORD_LENGTH} karakter.`
      });
    }

    const hashedPassword = await hash(bootstrapAdminPassword, 12);

    await prisma.user.create({
      data: {
        email: bootstrapAdminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN',
      },
    });

    return res.json({
      success: true,
      message: `Created bootstrap admin user (${bootstrapAdminEmail})`
    });
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    return res.status(500).json({ success: false, error: 'Failed to seed admin user' });
  }
});

// GET all users (ADMIN only)
router.get('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

export default router;
