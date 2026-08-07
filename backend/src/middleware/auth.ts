import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function authMiddleware(requiredRole?: 'ADMIN') {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!userId || !userRole) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    (req as AuthenticatedRequest).user = { id: userId, role: userRole };

    if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    next();
  };
}
