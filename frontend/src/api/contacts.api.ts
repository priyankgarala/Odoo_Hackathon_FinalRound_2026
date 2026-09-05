import { api } from "./client";
export type ContactType = "CUSTOMER" | "VENDOR" | "BOTH";
export type Contact = { id: number; name: string; type: ContactType; email: string | null; phone: string | null; address: string | null; profileImage: string | null; active: boolean; createdAt: string; updatedAt: string };
export type ContactInput = Omit<Contact, "id" | "active" | "createdAt" | "updatedAt">;
export type ContactList = { data: Contact[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
export type ContactFilters = { search?: string; type?: ContactType; active?: "true" | "false"; page: number; pageSize: number };
export const getContacts = async (params: ContactFilters) => (await api.get<ContactList>("/contacts", { params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")) })).data;
export const createContact = async (input: ContactInput) => (await api.post<{ data: Contact }>("/contacts", input)).data.data;
export const updateContact = async ({ id, input }: { id: number; input: ContactInput }) => (await api.put<{ data: Contact }>(`/contacts/${id}`, input)).data.data;
export const setContactStatus = async ({ id, active }: { id: number; active: boolean }) => (await api.patch<{ data: Contact }>(`/contacts/${id}/status`, { active })).data.data;
export const deleteContact = async (id: number) => (await api.delete(`/contacts/${id}`)).data;
export const deleteContactsBulk = async (ids: number[]) => (await api.delete("/contacts/bulk", { data: { ids } })).data;

