import { Router } from 'express';
import { User } from '../models/User.js';
import { makePasswordHash } from '../utils/password.js';
import { requirePermission } from '../middlewares/auth.js';

export const usersRoutes = Router();
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }
function tenantId(req: any) { return req.user?.tenantId || req.body.tenantId || req.query.tenantId; }

usersRoutes.get('/users', requirePermission('users.read'), aw(async (req: any, res: any) => {
  const data = await User.find({ tenantId: tenantId(req) }).limit(200).sort({ createdAt: -1 });
  res.json({ data });
}));

usersRoutes.post('/users', requirePermission('users.write'), aw(async (req: any, res: any) => {
  const { name, email, password, permissions, roleId, status } = req.body;
  const passwordHash = await makePasswordHash(String(password || 'change-me'));
  const user = await User.create({ tenantId: tenantId(req), name, email, passwordHash, permissions, roleId, status });
  res.status(201).json({ data: { id: user._id, name: user.name, email: user.email, status: user.status } });
}));
