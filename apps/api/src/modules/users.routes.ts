import { Router } from 'express';
import { User } from '../models/User.js';
import { makePasswordHash } from '../utils/password.js';
import { requirePermission } from '../middlewares/auth.js';

export const usersRoutes = Router();
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }
function tenantId(req: any) { return req.user?.tenantId || req.body.tenantId || req.query.tenantId; }
function normalizePermissions(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

usersRoutes.get('/users', requirePermission('users.read'), aw(async (req: any, res: any) => {
  const data = await User.find({ tenantId: tenantId(req) }).limit(200).sort({ createdAt: -1 });
  res.json({ data });
}));

usersRoutes.post('/users', requirePermission('users.write'), aw(async (req: any, res: any) => {
  const { name, email, password, permissions, roleId, status } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  if (!email) return res.status(400).json({ message: 'email is required' });
  if (!password) return res.status(400).json({ message: 'password is required' });
  const passwordHash = await makePasswordHash(String(password));
  const user = await User.create({ tenantId: tenantId(req), name, email, passwordHash, permissions: normalizePermissions(permissions), roleId, status });
  res.status(201).json({ data: { id: user._id, name: user.name, email: user.email, status: user.status } });
}));
