import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as service from "./analytic.service.js";

const id = z.coerce.number().int().positive();
const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(["INCOME", "EXPENSE"])
  }),
  params: z.object({}),
  query: z.object({})
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    active: z.boolean().optional()
  }),
  params: z.object({ id }),
  query: z.object({})
});

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    res.json(await service.listAnalytics(req.query as never));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json({ data: await service.getAnalytic(Number(req.params.id)) });
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("Admin", "Accountant"), validate(createSchema), async (req, res, next) => {
  try {
    res.status(201).json({ data: await service.createAnalytic(req.body) });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", authorize("Admin", "Accountant"), validate(updateSchema), async (req, res, next) => {
  try {
    res.json({ data: await service.updateAnalytic(Number(req.params.id), req.body) });
  } catch (e) {
    next(e);
  }
});

export { router as analyticRouter };
