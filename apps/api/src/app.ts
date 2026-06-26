import express from 'express';
import cors from 'cors';
import { routes } from './routes.js';
import { handleErrors } from './middlewares/errors.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1', routes);
app.use(handleErrors);
