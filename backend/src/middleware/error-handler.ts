import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export const notFound: RequestHandler = (_req, _res, next) => next(new AppError(404, "Route not found"));

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }
  const status = error instanceof AppError ? error.statusCode : 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
};
