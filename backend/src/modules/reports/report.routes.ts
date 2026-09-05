import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import * as service from "./report.service.js";

const router = Router();
router.use(authenticate);

router.get("/balance-sheet", async (req, res, next) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(String(req.query.asOfDate)) : undefined;
    res.json({ data: await service.getBalanceSheet(asOfDate) });
  } catch (e) {
    next(e);
  }
});

router.get("/profit-loss", async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
    res.json({ data: await service.getProfitLoss(startDate, endDate) });
  } catch (e) {
    next(e);
  }
});

router.get("/budget", async (req, res, next) => {
  try {
    const period = req.query.period ? String(req.query.period) : undefined;
    res.json({ data: await service.getBudgetReport(period) });
  } catch (e) {
    next(e);
  }
});

export { router as reportRouter };
