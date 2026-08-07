import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { compare } from 'bcryptjs';
import router from './auth';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

describe('auth router - login', () => {
  const loginHandler = router.stack.find((s) => s.route?.path === '/login')?.route?.stack[0].handle as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 if validation fails', async () => {
    const req = {
      body: {}
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should return 401 if user not found', async () => {
    const req = {
      body: { email: 'wrong@puu.local', password: 'password123' }
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Email atau password salah' });
  });

  it('should return 401 if password does not match', async () => {
    const req = {
      body: { email: 'admin@puu.local', password: 'wrongpassword' }
    } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const mockUser = {
      id: 'user-1',
      email: 'admin@puu.local',
      password: 'hashedpassword',
      name: 'Admin',
      role: 'ADMIN' as const,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    (vi.mocked(compare) as any).mockResolvedValue(false);

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Email atau password salah' });
  });

  it('should return user details if password matches', async () => {
    const req = {
      body: { email: 'admin@puu.local', password: 'admin123' }
    } as Request;
    const res = {
      json: vi.fn()
    } as unknown as Response;

    const mockUser = {
      id: 'user-1',
      email: 'admin@puu.local',
      password: 'hashedpassword',
      name: 'Admin',
      role: 'ADMIN' as const,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    (vi.mocked(compare) as any).mockResolvedValue(true);

    await loginHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: 'user-1',
        email: 'admin@puu.local',
        name: 'Admin',
        role: 'ADMIN'
      }
    });
  });
});
