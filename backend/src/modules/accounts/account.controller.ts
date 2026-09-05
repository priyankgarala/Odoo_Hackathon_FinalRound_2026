import type { RequestHandler } from "express";
import * as service from "./account.service.js";
export const create: RequestHandler = async (req, res, next) => { try { res.status(201).json({ data: await service.createAccount(req.body) }); } catch (error) { next(error); } };
export const list: RequestHandler = async (req, res, next) => { try { res.json(await service.listAccounts(req.query as never)); } catch (error) { next(error); } };
export const get: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.getAccount(Number(req.params.id)) }); } catch (error) { next(error); } };
export const update: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.updateAccount(Number(req.params.id), req.body) }); } catch (error) { next(error); } };
export const status: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.updateStatus(Number(req.params.id), req.body.active) }); } catch (error) { next(error); } };
