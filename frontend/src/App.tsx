import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { SystemAdministratorRoute } from "./features/auth/SystemAdministratorRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { AccountsPage } from "./pages/AccountsPage";
import { JournalsPage } from "./pages/JournalsPage";
import { JournalEntriesPage } from "./pages/JournalEntriesPage";
import { JournalEntryDetailsPage } from "./pages/JournalEntryDetailsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { PurchaseOrderDetailsPage } from "./pages/PurchaseOrderDetailsPage";
import { CreatePurchaseOrderPage } from "./pages/CreatePurchaseOrderPage";
import { VendorBillsPage } from "./pages/VendorBillsPage";
import { VendorBillDetailsPage } from "./pages/VendorBillDetailsPage";
import { SalesOrdersPage } from "./pages/SalesOrdersPage";
import { SalesOrderDetailsPage } from "./pages/SalesOrderDetailsPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceDetailsPage } from "./pages/InvoiceDetailsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { CreateUserPage } from "./pages/CreateUserPage";
import { CreateSalesOrderPage } from "./pages/CreateSalesOrderPage";
import { AnalyticAccountsPage } from "./pages/AnalyticAccountsPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { ReportsPage } from "./pages/ReportsPage";
import TaxesPage from "./pages/TaxesPage";

export const App = () => <Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
    <Route index element={<DashboardPage />} />
    <Route element={<SystemAdministratorRoute />}>
    <Route path="contacts" element={<ContactsPage />} />
    <Route path="products" element={<ProductsPage />} />
    <Route path="taxes" element={<TaxesPage />} />
    <Route path="accounts" element={<AccountsPage />} />
    <Route path="journals" element={<JournalsPage />} />
    <Route path="journal-entries" element={<JournalEntriesPage />} />
    <Route path="journal-entries/:id" element={<JournalEntryDetailsPage />} />
    <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
    <Route path="purchase-orders/new" element={<CreatePurchaseOrderPage />} />
    <Route path="purchase-orders/:id" element={<PurchaseOrderDetailsPage />} />
    <Route path="vendor-bills" element={<VendorBillsPage />} />
    <Route path="vendor-bills/:id" element={<VendorBillDetailsPage />} />
    <Route path="sales-orders" element={<SalesOrdersPage />} />
    <Route path="sales-orders/new" element={<CreateSalesOrderPage />} />
    <Route path="sales-orders/:id" element={<SalesOrderDetailsPage />} />
    <Route path="invoices" element={<InvoicesPage />} />
    <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
    <Route path="users/new" element={<CreateUserPage />} />
    <Route path="analyticals" element={<AnalyticAccountsPage />} />
    <Route path="budgets" element={<BudgetsPage />} />
    </Route>
    <Route path="reports" element={<ReportsPage />} />
    <Route path="reports/balance-sheet" element={<ReportsPage initialTab={0} />} />
    <Route path="reports/profit-and-loss" element={<ReportsPage initialTab={1} />} />
    <Route path="reports/budget" element={<ReportsPage initialTab={2} />} />
  </Route></Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>;
