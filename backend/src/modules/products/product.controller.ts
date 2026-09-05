import type { RequestHandler } from "express";
import * as service from "./product.service.js";
export const create: RequestHandler = async (req, res, next) => { try { res.status(201).json({ data: await service.createProduct(req.body) }); } catch (error) { next(error); } };
export const list: RequestHandler = async (req, res, next) => { try { res.json(await service.listProducts(req.query as never)); } catch (error) { next(error); } };
export const get: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.getProduct(Number(req.params.id)) }); } catch (error) { next(error); } };
export const update: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.updateProduct(Number(req.params.id), req.body) }); } catch (error) { next(error); } };
export const status: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.updateStatus(Number(req.params.id), req.body.active) }); } catch (error) { next(error); } };
