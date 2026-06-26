import { Router } from 'express';
import { seedPlans } from '../services/seed.service.js';

export const seed = Router();

seed.post('/seed/plans', async (_req, res) => {
  const data = await seedPlans();
  res.status(201).json({ data });
});
