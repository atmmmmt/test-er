import express from 'express';
import { routes } from './routes.js';

export const app = express();

app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1', routes);
