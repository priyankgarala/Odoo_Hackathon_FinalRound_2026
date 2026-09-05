import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { contactRouter } from "../modules/contacts/contact.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { accountRouter } from "../modules/accounts/account.routes.js";
import { journalEntryRouter, journalRouter } from "../modules/journals/journal.routes.js";
import { purchaseOrderRouter } from "../modules/purchase-orders/purchase-order.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/contacts", contactRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/accounts", accountRouter);
apiRouter.use("/journals", journalRouter);
apiRouter.use("/journal-entries", journalEntryRouter);
apiRouter.use("/purchase-orders", purchaseOrderRouter);
