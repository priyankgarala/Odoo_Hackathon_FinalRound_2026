import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { isSystemAdministrator } from "./roles";

export const SystemAdministratorRoute = () => {
  const { user } = useAuth();
  return isSystemAdministrator(user?.role) ? <Outlet /> : <Navigate to="/" replace />;
};
