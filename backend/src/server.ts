import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import locationsRouter from './routes/locations';
import reviewsRouter from './routes/reviews';
import searchRouter from './routes/search';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import feedbackRouter from './routes/feedback';

import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes
app.use('/api/locations', locationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/search', searchRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/feedback', feedbackRouter);

// Root health check
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'API is running and connected to database!' });
});

// Error handler (must come last)
app.use(errorHandler);


const PORT = process.env['PORT'] || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
