import { api } from "./client";
export type ContactType = "CUSTOMER" | "VENDOR" | "BOTH";
export type Contact = { id: number; name: string; type: ContactType; email: string | null; phone: string | null; address: string | null; active: boolean; createdAt: string; updatedAt: string };
export type ContactInput = Omit<Contact, "id" | "active" | "createdAt" | "updatedAt">;
export type ContactList = { data: Contact[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
export const getContacts = async (params: { search?: string; type?: ContactType; active?: string; page: number; pageSize: number }) => (await api.get<ContactList>("/contacts", { params })).data;
export const createContact = async (input: ContactInput) => (await api.post<{ data: Contact }>("/contacts", input)).data.data;
export const updateContact = async ({ id, input }: { id: number; input: ContactInput }) => (await api.put<{ data: Contact }>(`/contacts/${id}`, input)).data.data;
export const setContactStatus = async ({ id, active }: { id: number; active: boolean }) => (await api.patch<{ data: Contact }>(`/contacts/${id}/status`, { active })).data.data;
