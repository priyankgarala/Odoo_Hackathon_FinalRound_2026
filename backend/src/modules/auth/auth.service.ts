import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import type { AuthUser } from "./auth.types.js";
const publicUser = (user: { id: number; email: string; name: string; role: { name: string } }): AuthUser => ({ id: user.id, email: user.email, name: user.name, role: user.role.name });
export const loginUser = async (identifier: string, password: string) => {
  const normalized = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({ where: { OR: [{ email: normalized }, { loginId: normalized }] }, include: { role: true } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid email or password");
  const safeUser = publicUser(user);
  return { user: safeUser, token: jwt.sign(safeUser, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }) };
};
export const createUser = async (input: { name: string; loginId: string; email: string; password: string; roleName: string }) => {
  const role = await prisma.role.findUnique({ where: { name: input.roleName } });
  if (!role) throw new AppError(400, "Selected role is invalid");
  const loginId = input.loginId.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const duplicate = await prisma.user.findFirst({ where: { OR: [{ email }, { loginId }] } });
  if (duplicate) throw new AppError(409, "Email or login ID is already in use");
  const user = await prisma.user.create({ data: { name: input.name.trim(), loginId, email, passwordHash: await bcrypt.hash(input.password, 12), roleId: role.id }, include: { role: true } });
  const safeUser = publicUser(user);
  return { user: safeUser, token: jwt.sign(safeUser, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }) };
};
export const getCurrentUser = async (id: number) => { const user = await prisma.user.findUnique({ where: { id }, include: { role: true } }); if (!user || !user.isActive) throw new AppError(401, "Session is no longer valid"); return publicUser(user); };
