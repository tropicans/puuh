import { Router, Request, Response } from 'express';
import uploadRouter from './upload';
import authRouter from './auth';
import regulationsRouter from './regulations';
import versionsRouter from './versions';
import articlesRouter from './articles';
import judicialReviewsRouter from './judicial-reviews';
import articleChangesRouter from './article-changes';
import usersRouter from './users';
import seedRouter from './seed';
import dbStatusRouter from './db-status';
import tasksRouter from './tasks';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to PUU Tracker API' });
});

router.use('/upload', uploadRouter);
router.use('/auth', authRouter);
router.use('/regulations', regulationsRouter);
router.use('/versions', versionsRouter);
router.use('/articles', articlesRouter);
router.use('/judicial-reviews', judicialReviewsRouter);
router.use('/article-changes', articleChangesRouter);
router.use('/users', usersRouter);
router.use('/seed', seedRouter);
router.use('/db-status', dbStatusRouter);
router.use('/tasks', tasksRouter);

export default router;
