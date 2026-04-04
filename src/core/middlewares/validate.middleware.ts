import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { sendError } from '../utils/response';

export type ValidationType = 'body' | 'query' | 'params';

export const validateRequest =
  (schema: ZodSchema, type: ValidationType = 'body') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req[type]);
      // Type casting to ensure we overwrite the correct property
      (req as any)[type] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', error.issues);
        return;
      }
      sendError(res, 'Internal validation error', 400, 'INTERNAL_SERVER_ERROR');
    }
  };
