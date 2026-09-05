import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
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
  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({ error: "Database is unavailable. Please start PostgreSQL and try again." });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: "A record with this unique value already exists." });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    res.status(409).json({ error: "This record is used by financial history and cannot be deleted. Deactivate it instead." });
    return;
  }
  const status = error instanceof AppError ? error.statusCode : 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
};
