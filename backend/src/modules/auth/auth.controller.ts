import type { RequestHandler } from "express";
import { AUTH_COOKIE, authCookieOptions } from "../../config/auth.js";
import { createUser, getCurrentUser, loginUser } from "./auth.service.js";
import { ROLES } from "../../config/roles.js";
export const login: RequestHandler = async (req, res, next) => { try { const result = await loginUser(req.body.email, req.body.password); res.cookie(AUTH_COOKIE, result.token, authCookieOptions).json({ user: result.user }); } catch (error) { next(error); } };
export const register: RequestHandler = async (req, res, next) => { try { const result = await createUser({ ...req.body, roleName: ROLES.VIEWER }); res.cookie(AUTH_COOKIE, result.token, authCookieOptions).status(201).json({ user: result.user }); } catch (error) { next(error); } };
export const createByAdmin: RequestHandler = async (req, res, next) => { try { const { token: _token, ...result } = await createUser(req.body); res.status(201).json(result); } catch (error) { next(error); } };
export const me: RequestHandler = async (req, res, next) => { try { res.json({ user: await getCurrentUser(req.user!.id) }); } catch (error) { next(error); } };
export const logout: RequestHandler = (_req, res) => { res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: authCookieOptions.secure, sameSite: "lax", path: "/" }); res.status(204).send(); };
