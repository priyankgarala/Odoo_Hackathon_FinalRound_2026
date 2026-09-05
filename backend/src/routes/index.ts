import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { contactRouter } from "../modules/contacts/contact.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { accountRouter } from "../modules/accounts/account.routes.js";
import { journalEntryRouter, journalRouter } from "../modules/journals/journal.routes.js";
import { purchaseOrderRouter } from "../modules/purchase-orders/purchase-order.routes.js";
import { vendorBillRouter } from "../modules/vendor-bills/vendor-bill.routes.js";
import { salesOrderRouter } from "../modules/sales-orders/sales-order.routes.js";
import { invoiceRouter } from "../modules/invoices/invoice.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { analyticRouter } from "../modules/analyticals/analytic.routes.js";
import { budgetRouter } from "../modules/budgets/budget.routes.js";
import { reportRouter } from "../modules/reports/report.routes.js";
import { taxRouter } from "../modules/taxes/tax.routes.js";
import { categoryRouter } from "../modules/categories/category.routes.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../config/roles.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
// Viewers are deliberately limited to the management dashboard and reports.
// All operational/master-data endpoints require a System Administrator.
apiRouter.use((req, res, next) => {
  if (req.path.startsWith("/dashboard") || req.path.startsWith("/reports")) return next();
  return authenticate(req, res, (error) => error ? next(error) : authorize(ROLES.SYSTEM_ADMINISTRATOR)(req, res, next));
});
apiRouter.use("/contacts", contactRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/taxes", taxRouter);
apiRouter.use("/accounts", accountRouter);
apiRouter.use("/journals", journalRouter);
apiRouter.use("/journal-entries", journalEntryRouter);
apiRouter.use("/purchase-orders", purchaseOrderRouter);
apiRouter.use("/vendor-bills", vendorBillRouter);
apiRouter.use("/sales-orders", salesOrderRouter);
apiRouter.use("/invoices", invoiceRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/analyticals", analyticRouter);
apiRouter.use("/budgets", budgetRouter);
apiRouter.use("/reports", reportRouter);


