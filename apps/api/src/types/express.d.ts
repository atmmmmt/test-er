import type { AppUser } from './request.js';

declare global {
  namespace Express {
    interface Request { user?: AppUser; }
  }
}

export {};
