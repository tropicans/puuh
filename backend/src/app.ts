import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import router from './routes';

const app: Express = express();

app.use(cors());
app.use(express.json());

// Base/health route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.use('/api', router);

export default app;
