import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantMiddleware } from '../../src/core/middlewares/tenant.middleware';
import { AppError } from '../../src/core/middlewares/error.middleware';

describe('Tenant Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  it('should successfully extract vendor_id from req.vendor and attach it to req.vendorId', () => {
    const validVendorId = 'v123-abc';
    mockRequest.vendor = {
      vendor_id: validVendorId,
      email: 'test@example.com',
    };

    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect((mockRequest as any).vendorId).toBe(validVendorId);
  });

  it('should throw an AppError (403) when req.vendor is missing entirely', () => {
    // mockRequest.vendor is undefined
    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const capturedError = (nextFunction as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(capturedError.statusCode).toBe(403);
    expect(capturedError.code).toBe('TENANT_FORBIDDEN');
    expect((mockRequest as any).vendorId).toBeUndefined();
  });

  it('should throw an AppError (403) when req.vendor exists but vendor_id is missing', () => {
    mockRequest.vendor = {
      vendor_id: '', // empty or missing
      email: 'hacker@example.com',
    };

    tenantMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const capturedError = (nextFunction as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(capturedError.statusCode).toBe(403);
    expect(capturedError.code).toBe('TENANT_FORBIDDEN');
    expect((mockRequest as any).vendorId).toBeUndefined();
  });
});
