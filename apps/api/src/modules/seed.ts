import { Router } from 'express';
import { seedPlans } from '../services/seed.service.js';
import { seedDemo } from '../services/demo.service.js';

export const seed = Router();

seed.post('/seed/plans', async (_req, res) => {
  const data = await seedPlans();
  res.status(201).json({ data });
});

seed.post('/seed/demo', async (_req, res) => {
  const data = await seedDemo();
  res.status(201).json({ data });
});
