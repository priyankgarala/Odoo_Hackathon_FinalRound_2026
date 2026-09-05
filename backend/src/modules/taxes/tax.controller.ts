import type { Request, Response, NextFunction } from "express";
import * as taxService from "./tax.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await taxService.listTaxes(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tax = await taxService.getTaxById(Number(req.params.id));
    res.json({ data: tax });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tax = await taxService.createTax(req.body);
    res.status(201).json({ data: tax });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tax = await taxService.updateTax(Number(req.params.id), req.body);
    res.json({ data: tax });
  } catch (error) {
    next(error);
  }
};

export const status = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tax = await taxService.setTaxStatus(Number(req.params.id), req.body.isActive);
    res.json({ data: tax });
  } catch (error) {
    next(error);
  }
};
