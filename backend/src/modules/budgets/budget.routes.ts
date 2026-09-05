import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as service from "./budget.service.js";

const id = z.coerce.number().int().positive();
const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    period: z.string().trim().min(2).max(60),
    plannedAmount: z.coerce.number().finite().positive(),
    responsiblePerson: z.string().trim().min(2).max(120),
    analyticAccountId: id
  }),
  params: z.object({}),
  query: z.object({})
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    period: z.string().trim().min(2).max(60).optional(),
    plannedAmount: z.coerce.number().finite().positive().optional(),
    responsiblePerson: z.string().trim().min(2).max(120).optional(),
    analyticAccountId: id.optional()
  }),
  params: z.object({ id }),
  query: z.object({})
});

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const q = req.query as { period?: string; analyticAccountId?: string };
    res.json(await service.listBudgets({
      period: q.period,
      analyticAccountId: q.analyticAccountId ? Number(q.analyticAccountId) : undefined
    }));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json({ data: await service.getBudget(Number(req.params.id)) });
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("Admin", "Accountant"), validate(createSchema), async (req, res, next) => {
  try {
    res.status(201).json({ data: await service.createBudget(req.body) });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", authorize("Admin", "Accountant"), validate(updateSchema), async (req, res, next) => {
  try {
    res.json({ data: await service.updateBudget(Number(req.params.id), req.body) });
  } catch (e) {
    next(e);
  }
});

export { router as budgetRouter };
