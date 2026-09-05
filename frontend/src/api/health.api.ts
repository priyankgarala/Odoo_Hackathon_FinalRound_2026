import { api } from "./client";

export type HealthResponse = { status: string; api: string; database: string; timestamp: string };
export const getHealth = async () => (await api.get<HealthResponse>("/health")).data;
