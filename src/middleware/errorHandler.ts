import { Request, Response, NextFunction } from 'express';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  if (err?.status && err?.error) {
    res.status(err.status).json({ error: err.error, message: err.message });
    return;
  }

  if (err?.code === 'P2002') {
    res.status(409).json({ error: 'Conflict', message: 'Unique constraint violation' });
    return;
  }

  res.status(500).json({ error: 'InternalError', message: 'Something went wrong' });
}
