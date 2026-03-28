import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import prisma from './core/database/prisma.client';
import v1Routes from './core/routes/v1';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1', v1Routes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Orde-X Backend API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error: any) {
    console.log("Failed to start server!", error.message);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

startServer();
export default app;
