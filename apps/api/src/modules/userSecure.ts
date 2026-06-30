import { Router } from 'express';
import { User } from '../models/User.js';
import { makePasswordHash } from '../utils/password.js';

const defaultPermissions = ['users.read','users.write','products.read','products.write','stock.read','stock.write','parties.read','parties.write','purchase.read','purchase.write','sales.read','sales.write','reports.read'];

export const userSecure = Router();

userSecure.post('/secure-users', async (req, res) => {
  const { tenantId, name, email, password, permissions } = req.body;
  const existing = await User.countDocuments({ tenantId });
  if (existing > 0) return res.status(403).json({ message: 'Initial user already exists' });
  const passwordHash = await makePasswordHash(String(password || 'change-me'));
  const user = await User.create({ tenantId, name, email, passwordHash, permissions: permissions || defaultPermissions });
  res.status(201).json({ data: { id: user._id, name: user.name, email: user.email } });
});
