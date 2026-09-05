import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { contactRouter } from "../modules/contacts/contact.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/contacts", contactRouter);
