import type { RequestHandler } from "express";
import { AppError } from "./error-handler.js";
export const authorize = (...roles: string[]): RequestHandler => (req, _res, next) => !req.user ? next(new AppError(401, "Authentication required")) : roles.includes(req.user.role) ? next() : next(new AppError(403, "You do not have permission to perform this action"));
