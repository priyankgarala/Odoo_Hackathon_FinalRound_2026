import type { RequestHandler } from "express";
import * as service from "./journal.service.js";
export const journals: RequestHandler = async (_req, res, next) => { try { res.json({ data: await service.listJournals() }); } catch (e) { next(e); } };
export const createJournal: RequestHandler = async (req, res, next) => { try { res.status(201).json({ data: await service.createJournal(req.body) }); } catch (e) { next(e); } };
export const entries: RequestHandler = async (req, res, next) => { try { res.json(await service.listEntries(req.query as never)); } catch (e) { next(e); } };
export const entry: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.getEntry(Number(req.params.id)) }); } catch (e) { next(e); } };
export const create: RequestHandler = async (req, res, next) => { try { res.status(201).json({ data: await service.createManualEntry(req.body) }); } catch (e) { next(e); } };
export const post: RequestHandler = async (req, res, next) => { try { res.json({ data: await service.postEntry(Number(req.params.id)) }); } catch (e) { next(e); } };

