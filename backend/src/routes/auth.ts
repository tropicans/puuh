import { Router, Request, Response } from 'express';
import { compare } from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { loginSchema } from '../utils/validations';
import { logger } from '../utils/logger';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error.issues.map((i) => i.message).join(', ') });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error in backend:', error);
    return res.status(500).json({ success: false, error: 'Terjadi kesalahan internal server' });
  }
});

export default router;
