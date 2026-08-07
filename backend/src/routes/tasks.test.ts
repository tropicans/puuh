import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import router from './tasks';
import { TaskStatus, TaskType } from '@prisma/client';

vi.mock('../lib/prisma', () => ({
  prisma: {
    processTask: {
      findUnique: vi.fn(),
    },
  },
}));

describe('tasks router - GET /:id', () => {
  const route = router.stack.find((s) => s.route?.path === '/:id')?.route;
  const authMiddlewareMock = route?.stack[0].handle as any;
  const getTaskHandler = route?.stack[1].handle as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 if user headers are missing (authMiddleware check)', async () => {
    const req = {
      headers: {},
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddlewareMock(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if auth headers are present', async () => {
    const req = {
      headers: {
        'x-user-id': 'user-123',
        'x-user-role': 'ADMIN',
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    authMiddlewareMock(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 404 if task is not found', async () => {
    const req = {
      params: { id: 'invalid-id' },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(prisma.processTask.findUnique).mockResolvedValue(null);

    await getTaskHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Task not found' });
  });

  it('should return task details if found', async () => {
    const mockTask = {
      id: 'task-123',
      type: TaskType.UPLOAD_PDF,
      status: TaskStatus.PENDING,
      progress: 50,
      payload: { test: true },
      result: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const req = {
      params: { id: 'task-123' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(prisma.processTask.findUnique).mockResolvedValue(mockTask);

    await getTaskHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      task: {
        id: mockTask.id,
        type: mockTask.type,
        status: mockTask.status,
        progress: mockTask.progress,
        error: mockTask.error,
        result: mockTask.result,
        createdAt: mockTask.createdAt,
        updatedAt: mockTask.updatedAt,
      },
    });
  });
});
