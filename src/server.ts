import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Phase 4: Security Headers
app.use(helmet());

// Basic Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Phase 2: Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting specifically to auth routes to prevent brute-force attacks
app.use('/api/v1/auth', authLimiter, authRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Orde-X Backend API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
