import { Response } from 'express';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  meta: ApiMeta;
  error: ApiError | null;
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

/**
 * Send a standardised success response.
 * Shape: { data, meta, error: null }
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta: ApiMeta = {},
  statusCode = 200,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    data,
    meta,
    error: null,
  } satisfies ApiResponse<T>);
};

/**
 * Send a standardised error response.
 * Shape: { data: null, meta: {}, error: { code, message, details? } }
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown,
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    data: null,
    meta: {},
    error: { code, message, details: details ?? null },
  } satisfies ApiResponse<null>);
};
