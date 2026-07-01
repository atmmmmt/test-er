import { Router } from 'express';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyAccessToken } from '../utils/tokens.js';
import { passwordMatches } from '../utils/password.js';

export const sessionRoutes = Router();
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }

sessionRoutes.post('/login', aw(async (req: any, res: any) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await passwordMatches(String(password || ''), user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  user.lastLoginAt = new Date();
  await user.save();
  const payload = { userId: String(user._id), tenantId: String(user.tenantId), roleId: user.roleId ? String(user.roleId) : undefined, permissions: user.permissions || [] };
  res.json({ data: { user: { id: user._id, name: user.name, email: user.email }, accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) } });
}));

sessionRoutes.get('/me', aw(async (req: any, res: any) => {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ data: { user: { id: user._id, name: user.name, email: user.email, tenantId: user.tenantId, roleId: user.roleId, permissions: user.permissions || [], status: user.status }, tenantId: payload.tenantId, permissions: payload.permissions || [] } });
}));
