import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.api";
type AuthContextValue = { user: authApi.AuthUser | undefined; isLoading: boolean; login: ReturnType<typeof useMutation<authApi.AuthUser, Error, { email: string; password: string }>>; signup: ReturnType<typeof useMutation<authApi.AuthUser, Error, authApi.Registration>>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [signedOut, setSignedOut] = useState(false);
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.getMe, retry: false, staleTime: 5 * 60 * 1000, enabled: !signedOut });
  const login = useMutation({ mutationFn: authApi.login, onSuccess: (user) => { setSignedOut(false); queryClient.setQueryData(["auth", "me"], user); } });
  const signup = useMutation({ mutationFn: authApi.signup, onSuccess: (user) => { setSignedOut(false); queryClient.setQueryData(["auth", "me"], user); } });
  const logout = async () => {
    try { await authApi.logout(); }
    finally { setSignedOut(true); queryClient.removeQueries({ queryKey: ["auth", "me"] }); }
  };
  return <AuthContext.Provider value={{ user: signedOut ? undefined : session.data, isLoading: signedOut ? false : session.isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used within AuthProvider"); return value; };
