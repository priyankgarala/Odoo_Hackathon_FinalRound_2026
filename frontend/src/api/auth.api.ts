import { api } from "./client";
export type AuthUser = { id: number; email: string; name: string; role: string };
export const login = async (credentials: { email: string; password: string }) => (await api.post<{ user: AuthUser }>("/auth/login", credentials)).data.user;
export const getMe = async () => (await api.get<{ user: AuthUser }>("/auth/me")).data.user;
export const logout = async () => { await api.post("/auth/logout"); };
export type Registration = { name: string; loginId: string; email: string; password: string };
export const signup = async (input: Registration) => (await api.post<{ user: AuthUser }>("/auth/signup", input)).data.user;
export const createUser = async (input: Registration & { roleName: "System Administrator" | "Viewer" }) => (await api.post<{ user: AuthUser }>("/auth/users", input)).data.user;
