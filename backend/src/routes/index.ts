import { Router, Request, Response } from 'express';
import uploadRouter from './upload';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to PUU Tracker API' });
});

router.use('/upload', uploadRouter);

export default router;
