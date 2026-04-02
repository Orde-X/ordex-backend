import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to Express's next(err) — eliminates try/catch boilerplate in every controller.
 *
 * Usage:
 *   router.get('/products', asyncHandler(controller.list));
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
