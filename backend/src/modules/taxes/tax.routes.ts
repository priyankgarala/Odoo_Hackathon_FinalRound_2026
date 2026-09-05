import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./tax.controller.js";
import {
  createTaxSchema,
  getTaxSchema,
  listTaxSchema,
  statusTaxSchema,
  updateTaxSchema
} from "./tax.schemas.js";

export const taxRouter = Router();

taxRouter.use(authenticate);

taxRouter.get("/", validate(listTaxSchema), controller.list);
taxRouter.get("/:id", validate(getTaxSchema), controller.get);
taxRouter.post("/", authorize("Admin", "Accountant"), validate(createTaxSchema), controller.create);
taxRouter.put("/:id", authorize("Admin", "Accountant"), validate(updateTaxSchema), controller.update);
taxRouter.patch("/:id/status", authorize("Admin", "Accountant"), validate(statusTaxSchema), controller.status);
