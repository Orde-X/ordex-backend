import { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/response';

// ─── App Error Class ──────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static unprocessable(message: string, details?: unknown) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.join(', ') ?? 'field';
      sendError(res, `A record with this ${field} already exists.`, 409, 'CONFLICT');
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 'Record not found.', 404, 'NOT_FOUND');
      return;
    }
  }

  // Unhandled — log and return generic 500
  console.error('💥 Unhandled error:', err);
  sendError(res, 'An unexpected error occurred.', 500, 'INTERNAL_ERROR');
};
