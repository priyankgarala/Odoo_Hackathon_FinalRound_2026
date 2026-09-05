import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE } from "../config/auth.js";
import { env } from "../config/env.js";
import { AppError } from "./error-handler.js";
import type { AuthUser } from "../modules/auth/auth.types.js";
export const authenticate: RequestHandler = (req, _res, next) => { const token = req.cookies?.[AUTH_COOKIE]; if (!token) return next(new AppError(401, "Authentication required")); try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser; next(); } catch { next(new AppError(401, "Invalid or expired session")); } };
