import { Activity } from '../models/Activity.js';

export async function logActivity(input: {
  tenantId: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  message?: string;
  meta?: unknown;
}) {
  return Activity.create(input);
}
