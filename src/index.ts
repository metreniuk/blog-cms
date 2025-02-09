import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimit';
import postsRouter from './routes/posts';
import usersRouter from './routes/users';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});