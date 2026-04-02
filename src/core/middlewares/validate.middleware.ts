import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { sendError } from '../utils/response';

export const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', error.issues);
        return;
      }
      sendError(res, 'Internal validation error', 400, 'VALIDATION_ERROR');
    }
  };
