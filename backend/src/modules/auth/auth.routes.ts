import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { createByAdmin, login, logout, me, register } from "./auth.controller.js";

const password = z.string().min(8, "Password must contain at least 8 characters").max(128).regex(/[a-z]/, "Password needs a lowercase letter").regex(/[A-Z]/, "Password needs an uppercase letter").regex(/[^A-Za-z0-9]/, "Password needs a special character");
const credentials = z.object({ name: z.string().min(2).max(100), loginId: z.string().trim().toLowerCase().min(6).max(12).regex(/^[a-z0-9._-]+$/, "Login ID may contain letters, numbers, dots, hyphens, and underscores"), email: z.string().trim().toLowerCase().email().max(254), password });
const loginSchema = z.object({ body: z.object({ email: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) }), params: z.object({}), query: z.object({}) });
const signupSchema = z.object({ body: credentials, params: z.object({}), query: z.object({}) });
const createSchema = z.object({ body: credentials.extend({ roleName: z.enum(["Admin", "Accountant", "Sales", "Purchase", "Viewer"]) }), params: z.object({}), query: z.object({}) });

export const authRouter = Router();
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/signup", validate(signupSchema), register);
authRouter.post("/users", authenticate, authorize("Admin"), validate(createSchema), createByAdmin);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", authenticate, logout);
