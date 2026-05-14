import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import emotionRoutes from './routes/emotions';
import teamRoutes from './routes/teams';
import eventRoutes from './routes/events';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/emotions', emotionRoutes);
app.use('/teams', teamRoutes);
app.use('/events', eventRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend running on :${port}`));
