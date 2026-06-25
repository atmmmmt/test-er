import { Router } from 'express';

export const sessionRoutes = Router();

sessionRoutes.get('/me', (_req, res) => {
  res.json({ data: { ready: true } });
});
