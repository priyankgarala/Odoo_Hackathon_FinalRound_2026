import { api } from "./client";
export type Journal = {
  id: number;
  code: string;
  name: string;
  type: "SALES" | "PURCHASE" | "CASH" | "BANK" | "GENERAL";
  defaultAccountId?: number | null;
  defaultAccount?: { id: number; code: string; name: string; type: string } | null;
  active: boolean;
};
export type EntryLine = {
  id: number;
  accountId: number;
  partnerId?: number | null;
  debit: string;
  credit: string;
  description: string | null;
  account: { id: number; code: string; name: string; type: string };
  partner?: { id: number; name: string; type: string } | null;
};
export type JournalEntry = {
  id: number;
  entryNumber: string;
  entryDate: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  status: "DRAFT" | "POSTED";
  journal: Journal;
  lines?: EntryLine[];
  _count?: { lines: number };
};
export type EntryList = { data: JournalEntry[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export const getJournals = async () => (await api.get<{ data: Journal[] }>("/journals")).data.data;
export const createJournal = async (data: { name: string; type: Journal["type"]; defaultAccountId?: number | null }) =>
  (await api.post<{ data: Journal }>("/journals", data)).data.data;

export type JournalEntryFilters = { search?: string; journalId?: number; status?: "DRAFT" | "POSTED"; page: number; pageSize: number };
export const getEntries = async (params: JournalEntryFilters) =>
  (await api.get<EntryList>("/journal-entries", { params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")) })).data;
export const getEntry = async (id: number) => (await api.get<{ data: JournalEntry }>(`/journal-entries/${id}`)).data.data;
export const createEntry = async (data: {
  journalId: number;
  entryDate: string;
  description?: string | null;
  lines: Array<{ accountId: number; partnerId?: number | null; debit: number; credit: number; description?: string | null }>;
  postNow?: boolean;
}) => (await api.post<{ data: JournalEntry }>("/journal-entries", data)).data.data;
export const postEntry = async (id: number) => (await api.post<{ data: JournalEntry }>(`/journal-entries/${id}/post`)).data.data;

