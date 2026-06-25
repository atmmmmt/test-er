import { Router } from 'express';
import { Tenant } from '../models/Tenant.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { COMPANY_ADMIN_PERMISSIONS } from '../config/permissions.js';

export const companyRoutes = Router();

companyRoutes.post('/setup', async (req, res) => {
  const { companyName, slug, name, email } = req.body;
  const tenant = await Tenant.create({ name: companyName, slug, status: 'trial' });
  const role = await Role.create({ tenantId: tenant._id, name: 'Company Admin', permissions: COMPANY_ADMIN_PERMISSIONS, isSystem: true });
  const user = await User.create({ tenantId: tenant._id, name, email, passwordHash: 'change-me', roleId: role._id, permissions: COMPANY_ADMIN_PERMISSIONS });
  res.status(201).json({ data: { tenant, role, user } });
});
