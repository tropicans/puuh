import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from './auth';

describe('authMiddleware', () => {
  it('should return 401 if x-user-id or x-user-role is missing', () => {
    const middleware = authMiddleware();
    const req = {
      headers: {}
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if role is not ADMIN and requiredRole is ADMIN', () => {
    const middleware = authMiddleware('ADMIN');
    const req = {
      headers: {
        'x-user-id': 'user-123',
        'x-user-role': 'VIEWER'
      }
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if headers are valid', () => {
    const middleware = authMiddleware();
    const req = {
      headers: {
        'x-user-id': 'user-123',
        'x-user-role': 'VIEWER'
      }
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect((req as AuthenticatedRequest).user).toEqual({
      id: 'user-123',
      role: 'VIEWER'
    });
    expect(next).toHaveBeenCalled();
  });

  it('should call next if requiredRole is ADMIN and user role is ADMIN', () => {
    const middleware = authMiddleware('ADMIN');
    const req = {
      headers: {
        'x-user-id': 'admin-123',
        'x-user-role': 'ADMIN'
      }
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect((req as AuthenticatedRequest).user).toEqual({
      id: 'admin-123',
      role: 'ADMIN'
    });
    expect(next).toHaveBeenCalled();
  });
});
