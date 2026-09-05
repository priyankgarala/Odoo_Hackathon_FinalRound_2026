import type { RequestHandler } from "express";
import { AppError } from "./error-handler.js";
import { ROLES } from "../config/roles.js";

export const authorize = (...roles: string[]): RequestHandler => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, "Authentication required"));
  // System Administrator is the only operational role in the two-role model.
  return (roles.includes(ROLES.SYSTEM_ADMINISTRATOR) || roles.length > 0) && req.user.role === ROLES.SYSTEM_ADMINISTRATOR
    ? next()
    : next(new AppError(403, "You do not have permission to perform this action"));
};
