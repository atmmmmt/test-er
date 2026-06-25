import type { Types } from 'mongoose';

export type AppUser = {
  userId: string;
  tenantId: string;
  roleId?: string;
  permissions: string[];
  isOwner?: boolean;
};

export type TenantFilter = {
  tenantId: Types.ObjectId | string;
};
