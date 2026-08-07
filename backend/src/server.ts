import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`[backend]: Server is running at http://localhost:${PORT}`);
});
