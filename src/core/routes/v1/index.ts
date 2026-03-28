import { Router } from "express";
import rateLimit from "express-rate-limit";
import authRoutes from "../../../modules/auth/auth.routes";

const router = Router();

// Apply rate limiting specifically to auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

router.use("/auth", authLimiter, authRoutes);

export default router;