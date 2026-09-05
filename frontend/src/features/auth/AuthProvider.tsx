import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.api";
type AuthContextValue = { user: authApi.AuthUser | undefined; isLoading: boolean; login: ReturnType<typeof useMutation<authApi.AuthUser, Error, { email: string; password: string }>>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.getMe, retry: false, staleTime: 5 * 60 * 1000 });
  const login = useMutation({ mutationFn: authApi.login, onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user) });
  const logout = async () => { try { await authApi.logout(); } finally { queryClient.setQueryData(["auth", "me"], undefined); } };
  return <AuthContext.Provider value={{ user: session.data, isLoading: session.isLoading, login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used within AuthProvider"); return value; };
