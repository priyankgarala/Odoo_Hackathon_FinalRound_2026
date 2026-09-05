import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./category.controller.js";
import {
  createCategorySchema,
  getCategorySchema,
  listCategorySchema,
  updateCategorySchema
} from "./category.schemas.js";

export const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.get("/", validate(listCategorySchema), controller.list);
categoryRouter.get("/:id", validate(getCategorySchema), controller.get);
categoryRouter.post("/", authorize("Admin", "Accountant"), validate(createCategorySchema), controller.create);
categoryRouter.put("/:id", authorize("Admin", "Accountant"), validate(updateCategorySchema), controller.update);
