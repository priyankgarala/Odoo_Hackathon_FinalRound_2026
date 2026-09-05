import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny): RequestHandler => (req, _res, next) => {
  schema.parse({ body: req.body, params: req.params, query: req.query });
  next();
};
