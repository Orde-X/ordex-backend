"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isResourceOwner = exports.checkRole = exports.isAuthenticated = void 0;
const jwt_utils_1 = require("../../core/utils/jwt.utils");
const prisma_client_1 = __importDefault(require("../../core/database/prisma.client"));
const isAuthenticated = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication token missing or invalid' });
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        req.user = {
            userId: payload.userId,
            role: payload.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.isAuthenticated = isAuthenticated;
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.checkRole = checkRole;
const isResourceOwner = (paramName = 'id') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        // In a real implementation this might fetch the resource to check its ownerId.
        // For simplicity, if the resource ID is equal to the user ID (e.g. updating profile):
        const resourceId = req.params[paramName];
        if (resourceId === req.user.userId) {
            return next();
        }
        // Example: checking a Product ownership
        if (paramName === 'productId') {
            const product = await prisma_client_1.default.product.findUnique({ where: { id: resourceId } });
            if (product && product.supplierId === req.user.userId) {
                return next();
            }
        }
        return res.status(403).json({ message: 'Forbidden: You do not own this resource' });
    };
};
exports.isResourceOwner = isResourceOwner;
