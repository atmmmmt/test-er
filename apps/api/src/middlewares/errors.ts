import type { NextFunction, Request, Response } from 'express';

export function handleErrors(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = error instanceof Error ? error.message : 'Server error';
  return res.status(500).json({ message });
}
