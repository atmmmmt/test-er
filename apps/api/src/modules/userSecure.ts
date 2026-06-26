import { Router } from 'express';
import { User } from '../models/User.js';
import { makePasswordHash } from '../utils/password.js';

export const userSecure = Router();

userSecure.post('/secure-users', async (req, res) => {
  const { tenantId, name, email, password, permissions } = req.body;
  const passwordHash = await makePasswordHash(String(password || 'change-me'));
  const user = await User.create({ tenantId, name, email, passwordHash, permissions: permissions || [] });
  res.status(201).json({ data: { id: user._id, name: user.name, email: user.email } });
});
