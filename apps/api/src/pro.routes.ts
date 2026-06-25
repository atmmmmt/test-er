import { Router } from 'express';
import { companyRoutes } from './modules/company.routes.js';
import { sessionRoutes } from './modules/session.routes.js';

export const proRoutes = Router();
proRoutes.use('/companies', companyRoutes);
proRoutes.use('/session', sessionRoutes);
proRoutes.get('/ready', (_req, res) => res.json({ ok: true }));
