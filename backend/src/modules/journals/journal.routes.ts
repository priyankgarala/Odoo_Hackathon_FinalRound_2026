import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as c from "./journal.controller.js";
import { createEntrySchema, createJournalSchema, idSchema, listEntrySchema } from "./journal.schemas.js";
export const journalRouter = Router(); export const journalEntryRouter = Router();
journalRouter.use(authenticate);
journalRouter.get("/", c.journals);
journalRouter.post("/", authorize("Admin", "Accountant"), validate(createJournalSchema), c.createJournal);
journalEntryRouter.use(authenticate);
journalEntryRouter.get("/", validate(listEntrySchema), c.entries);
journalEntryRouter.get("/:id", validate(idSchema), c.entry);
journalEntryRouter.post("/", authorize("Admin", "Accountant"), validate(createEntrySchema), c.create);
journalEntryRouter.post("/:id/post", authorize("Admin", "Accountant"), validate(idSchema), c.post);

