import type { ContactType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
type ContactInput = { name: string; type: ContactType; email: string | null; phone: string | null; address: string | null; profileImage?: string | null };
const getById = async (id: number) => { const contact = await prisma.contact.findUnique({ where: { id } }); if (!contact) throw new AppError(404, "Contact not found"); return contact; };
export const createContact = (data: ContactInput) => prisma.contact.create({ data });
export const listContacts = async (query: { search?: string; type?: ContactType; active?: "true" | "false"; page: number; pageSize: number }) => {
  const where: Prisma.ContactWhereInput = { ...(query.type ? { type: query.type === "CUSTOMER" ? { in: ["CUSTOMER", "BOTH"] } : query.type === "VENDOR" ? { in: ["VENDOR", "BOTH"] } : "BOTH" } : {}), ...(query.active ? { active: query.active === "true" } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { email: { contains: query.search, mode: "insensitive" } }, { phone: { contains: query.search, mode: "insensitive" } }] } : {}) };
  const [data, total] = await prisma.$transaction([prisma.contact.findMany({ where, orderBy: { name: "asc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }), prisma.contact.count({ where })]);
  return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};
export const getContact = getById;
export const updateContact = async (id: number, data: ContactInput) => { await getById(id); return prisma.contact.update({ where: { id }, data }); };
export const updateStatus = async (id: number, active: boolean) => { await getById(id); return prisma.contact.update({ where: { id }, data: { active } }); };
export const deleteContact = async (id: number) => {
  await getById(id);
  try {
    return await prisma.contact.delete({ where: { id } });
  } catch (err: any) {
    // If foreign key constraint prevents deletion (e.g. linked to Sales Orders/Invoices), soft delete
    return await prisma.contact.update({ where: { id }, data: { active: false } });
  }
};
export const deleteManyContacts = async (ids: number[]) => {
  if (!ids.length) throw new AppError(400, "Select at least one contact to delete");
  return Promise.all(
    ids.map(async (id) => {
      try {
        return await prisma.contact.delete({ where: { id } });
      } catch {
        return await prisma.contact.update({ where: { id }, data: { active: false } });
      }
    })
  );
};

