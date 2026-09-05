import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const administrator = await prisma.role.upsert({ where: { name: "System Administrator" }, update: {}, create: { name: "System Administrator" } });
  const viewer = await prisma.role.upsert({ where: { name: "Viewer" }, update: {}, create: { name: "Viewer" } });

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({ where: { email: "admin@urbanfurniture.local" }, data: { name: "System Administrator", roleId: administrator.id } });
    await tx.user.updateMany({ where: { email: { not: "admin@urbanfurniture.local" } }, data: { roleId: viewer.id } });
    await tx.role.deleteMany({ where: { name: { notIn: ["System Administrator", "Viewer"] } } });
  });
  console.log("Roles consolidated: System Administrator, Viewer");
}

main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
