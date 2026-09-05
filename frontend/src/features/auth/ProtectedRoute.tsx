import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "../../components/feedback/LoadingState";
import { useAuth } from "./AuthProvider";
export const ProtectedRoute = () => { const { user, isLoading } = useAuth(); const location = useLocation(); if (isLoading) return <LoadingState label="Restoring your session..." />; return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />; };
