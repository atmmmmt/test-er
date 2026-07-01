import { Router } from 'express';
import { seedPlans } from '../services/seed.service.js';
import { seedDemo } from '../services/demo.service.js';

export const seed = Router();
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }
function seedEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_SEED === 'true';
}
function guardSeed(res: any) {
  if (seedEnabled()) return false;
  res.status(403).json({ message: 'Seed is disabled in production' });
  return true;
}

seed.post('/seed/plans', aw(async (_req: any, res: any) => {
  if (guardSeed(res)) return;
  const data = await seedPlans();
  res.status(201).json({ data });
}));

seed.post('/seed/demo', aw(async (_req: any, res: any) => {
  if (guardSeed(res)) return;
  const data = await seedDemo();
  res.status(201).json({ data });
}));
