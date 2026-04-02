"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validateRequest = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            (0, response_1.sendError)(res, 'Validation failed', 400, 'VALIDATION_ERROR', error.issues);
            return;
        }
        (0, response_1.sendError)(res, 'Internal validation error', 400, 'VALIDATION_ERROR');
    }
};
exports.validateRequest = validateRequest;
