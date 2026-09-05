import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { login, logout, me } from "./auth.controller.js";
const loginSchema = z.object({ body: z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }), params: z.object({}), query: z.object({}) });
export const authRouter = Router();
authRouter.post("/login", validate(loginSchema), login); authRouter.get("/me", authenticate, me); authRouter.post("/logout", authenticate, logout);
