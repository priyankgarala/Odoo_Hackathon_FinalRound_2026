import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { LoginPage } from "./pages/LoginPage";
export const App = () => <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route index element={<DashboardPage />} /><Route path="contacts" element={<ContactsPage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
