import type { RequestHandler } from "express";
import { prisma } from "../../lib/prisma.js";

export const healthCheck: RequestHandler = async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", api: "connected", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};
