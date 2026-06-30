import { Router } from 'express';
import { seedPlans } from '../services/seed.service.js';
import { seedDemo } from '../services/demo.service.js';

export const seed = Router();
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }

seed.post('/seed/plans', aw(async (_req: any, res: any) => {
  const data = await seedPlans();
  res.status(201).json({ data });
}));

seed.post('/seed/demo', aw(async (_req: any, res: any) => {
  const data = await seedDemo();
  res.status(201).json({ data });
}));
