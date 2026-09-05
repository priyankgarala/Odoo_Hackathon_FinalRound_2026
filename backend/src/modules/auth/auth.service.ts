import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import type { AuthUser } from "./auth.types.js";
const publicUser = (user: { id: number; email: string; name: string; role: { name: string } }): AuthUser => ({ id: user.id, email: user.email, name: user.name, role: user.role.name });
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid email or password");
  const safeUser = publicUser(user);
  return { user: safeUser, token: jwt.sign(safeUser, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }) };
};
export const getCurrentUser = async (id: number) => { const user = await prisma.user.findUnique({ where: { id }, include: { role: true } }); if (!user || !user.isActive) throw new AppError(401, "Session is no longer valid"); return publicUser(user); };
