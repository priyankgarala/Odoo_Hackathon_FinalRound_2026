import type { Request, Response, NextFunction } from "express";
import * as categoryService from "./category.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.listCategories(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.getCategoryById(Number(req.params.id));
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.updateCategory(Number(req.params.id), req.body);
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
};
