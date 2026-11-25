import type { RequestHandler } from 'express';

export const logRequests: RequestHandler = (req, res, next) => {
  const started = Date.now();
  res.on('finish', () =>
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${Date.now() - started}ms`),
  );
  next();
};
