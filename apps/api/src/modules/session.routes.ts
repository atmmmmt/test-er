import { Router } from 'express';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken } from '../utils/tokens.js';
import { passwordMatches } from '../utils/password.js';

export const sessionRoutes = Router();

sessionRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await passwordMatches(String(password || ''), user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  user.lastLoginAt = new Date();
  await user.save();
  const payload = { userId: String(user._id), tenantId: String(user.tenantId), roleId: user.roleId ? String(user.roleId) : undefined, permissions: user.permissions || [] };
  res.json({ data: { user: { id: user._id, name: user.name, email: user.email }, accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) } });
});

sessionRoutes.get('/me', (_req, res) => {
  res.json({ data: { ready: true } });
});
