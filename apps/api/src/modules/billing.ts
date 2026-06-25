import { Router } from 'express';
import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';

export const billing = Router();

billing.get('/plans', async (_req, res) => res.json({ data: await Plan.find().sort({ priceMonthly: 1 }) }));
billing.post('/plans', async (req, res) => res.status(201).json({ data: await Plan.create(req.body) }));
billing.get('/subscriptions', async (_req, res) => res.json({ data: await Subscription.find().sort({ createdAt: -1 }) }));
billing.post('/subscriptions', async (req, res) => res.status(201).json({ data: await Subscription.create(req.body) }));
