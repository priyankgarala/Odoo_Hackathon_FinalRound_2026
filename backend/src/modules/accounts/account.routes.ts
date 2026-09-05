import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./account.controller.js";
import { createAccountSchema, getAccountSchema, listAccountsSchema, statusAccountSchema, updateAccountSchema } from "./account.schemas.js";
export const accountRouter = Router();
accountRouter.use(authenticate); accountRouter.get("/", validate(listAccountsSchema), controller.list); accountRouter.get("/:id", validate(getAccountSchema), controller.get);
accountRouter.post("/", authorize("Admin", "Accountant"), validate(createAccountSchema), controller.create); accountRouter.put("/:id", authorize("Admin", "Accountant"), validate(updateAccountSchema), controller.update); accountRouter.patch("/:id/status", authorize("Admin", "Accountant"), validate(statusAccountSchema), controller.status);
