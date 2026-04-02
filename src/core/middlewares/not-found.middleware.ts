import { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/response';

/**
 * 404 handler — catches any request that didn't match a route.
 * Must be registered AFTER all other routes.
 */
export const notFoundHandler = (_req: Request, res: Response, _next: NextFunction): void => {
  sendError(res, `Route ${_req.method} ${_req.originalUrl} not found.`, 404, 'NOT_FOUND');
};
