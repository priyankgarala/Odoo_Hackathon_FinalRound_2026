import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const roles = ["Admin", "Accountant", "Sales", "Purchase", "Viewer"];
async function main() {
  for (const name of roles) await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({ where: { email: "admin@urbanfurniture.local" }, update: { name: "System Administrator", passwordHash, roleId: role.id, isActive: true }, create: { name: "System Administrator", email: "admin@urbanfurniture.local", passwordHash, roleId: role.id } });
  const accounts = [
    { code: "1000", name: "Cash", type: "ASSET" }, { code: "1010", name: "Bank", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" }, { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "2100", name: "Tax Payable", type: "LIABILITY" }, { code: "3000", name: "Owner's Equity", type: "EQUITY" },
    { code: "4000", name: "Sales Revenue", type: "REVENUE" }, { code: "5000", name: "Purchase Expense", type: "EXPENSE" },
  ] as const;
  for (const account of accounts) await prisma.account.upsert({ where: { code: account.code }, update: { name: account.name, type: account.type }, create: account });
  const journals = [
    { code: "SAL", name: "Sales Journal", type: "SALES" }, { code: "PUR", name: "Purchase Journal", type: "PURCHASE" },
    { code: "CSH", name: "Cash Journal", type: "CASH" }, { code: "BNK", name: "Bank Journal", type: "BANK" }, { code: "GEN", name: "General Journal", type: "GENERAL" },
  ] as const;
  for (const journal of journals) await prisma.journal.upsert({ where: { code: journal.code }, update: { name: journal.name, type: journal.type, active: true }, create: journal });

  const contacts = [
    { name: "Oak & Grain Suppliers", email: "orders@oakgrain.demo", type: "VENDOR" as const, phone: "+91 98765 10001", address: "Ahmedabad, Gujarat" },
    { name: "Metro Furnishings Wholesale", email: "sales@metrofurnish.demo", type: "VENDOR" as const, phone: "+91 98765 10002", address: "Surat, Gujarat" },
    { name: "Studio Living Partners", email: "hello@studioliving.demo", type: "BOTH" as const, phone: "+91 98765 10003", address: "Vadodara, Gujarat" },
    { name: "Priya Design House", email: "accounts@priyadesign.demo", type: "CUSTOMER" as const, phone: "+91 98765 10004", address: "Ahmedabad, Gujarat" },
  ];
  for (const contact of contacts) await prisma.contact.upsert({ where: { email: contact.email }, update: { ...contact, active: true }, create: { ...contact, active: true } });
  const products = [
    { sku: "UF-CHAIR-001", name: "Ergo Dining Chair", description: "Solid wood dining chair", unitPrice: "3500.00" },
    { sku: "UF-TABLE-001", name: "Oak Work Table", description: "Six-seat oak work table", unitPrice: "12500.00" },
    { sku: "UF-SOFA-001", name: "Lounge Sofa", description: "Three-seater fabric sofa", unitPrice: "28000.00" },
    { sku: "UF-LAMP-001", name: "Arc Floor Lamp", description: "Powder-coated floor lamp", unitPrice: "4200.00" },
    { sku: "UF-SHELF-001", name: "Wall Shelf Set", description: "Modular wall shelf set", unitPrice: "6800.00" },
  ];
  for (const product of products) await prisma.product.upsert({ where: { sku: product.sku }, update: { ...product, active: true }, create: { ...product, active: true } });

  const vendorOne = await prisma.contact.findUniqueOrThrow({ where: { email: "orders@oakgrain.demo" } });
  const vendorTwo = await prisma.contact.findUniqueOrThrow({ where: { email: "sales@metrofurnish.demo" } });
  const [chair, table, sofa, lamp, shelf] = await Promise.all(products.map((product) => prisma.product.findUniqueOrThrow({ where: { sku: product.sku } })));
  const makeItems = (items: Array<{ product: typeof chair; quantity: number; unitPrice: string; taxRate: string }>) => items.map(({ product, quantity, unitPrice, taxRate }) => {
    const subtotal = Number(unitPrice) * quantity; const tax = subtotal * Number(taxRate) / 100;
    return { productId: product.id, productSku: product.sku, productName: product.name, quantity: String(quantity), unitPrice, taxRate, lineSubtotal: subtotal.toFixed(2), taxAmount: tax.toFixed(2), lineTotal: (subtotal + tax).toFixed(2) };
  });
  const demoOrders = [
    { orderNumber: "PO-DEMO-001", vendor: vendorOne, status: "CONFIRMED" as const, items: makeItems([{ product: chair, quantity: 12, unitPrice: "3100.00", taxRate: "18.00" }, { product: table, quantity: 3, unitPrice: "11500.00", taxRate: "18.00" }]) },
    { orderNumber: "PO-DEMO-002", vendor: vendorTwo, status: "CONFIRMED" as const, items: makeItems([{ product: sofa, quantity: 4, unitPrice: "25500.00", taxRate: "18.00" }, { product: lamp, quantity: 10, unitPrice: "3800.00", taxRate: "12.00" }]) },
    { orderNumber: "PO-DEMO-003", vendor: vendorOne, status: "DRAFT" as const, items: makeItems([{ product: shelf, quantity: 8, unitPrice: "6200.00", taxRate: "18.00" }]) },
  ];
  for (const order of demoOrders) {
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.lineSubtotal), 0); const taxTotal = order.items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
    await prisma.purchaseOrder.upsert({ where: { orderNumber: order.orderNumber }, update: { vendorId: order.vendor.id, status: order.status, subtotal: subtotal.toFixed(2), taxTotal: taxTotal.toFixed(2), total: (subtotal + taxTotal).toFixed(2) }, create: { orderNumber: order.orderNumber, vendorId: order.vendor.id, status: order.status, subtotal: subtotal.toFixed(2), taxTotal: taxTotal.toFixed(2), total: (subtotal + taxTotal).toFixed(2), items: { create: order.items } } });
  }
  const purchaseJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "PUR" } }); const bankJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "BNK" } }); const expense = await prisma.account.findUniqueOrThrow({ where: { code: "5000" } }); const payable = await prisma.account.findUniqueOrThrow({ where: { code: "2000" } }); const bank = await prisma.account.findUniqueOrThrow({ where: { code: "1010" } });
  for (const [index, billCode] of ["VB-DEMO-001", "VB-DEMO-002"].entries()) {
    const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { orderNumber: `PO-DEMO-00${index + 1}` }, include: { items: true } });
    const entry = await prisma.journalEntry.upsert({ where: { entryNumber: `JE-${billCode}` }, update: {}, create: { entryNumber: `JE-${billCode}`, entryDate: new Date(), journalId: purchaseJournal.id, referenceType: "VENDOR_BILL", referenceId: billCode, description: `Demo vendor bill ${billCode}`, status: "POSTED", lines: { create: [{ accountId: expense.id, debit: po.total, credit: 0 }, { accountId: payable.id, debit: 0, credit: po.total }] } } });
    const paymentAmount = index === 0 ? Number(po.total) / 2 : Number(po.total);
    const bill = await prisma.vendorBill.upsert({ where: { billNumber: billCode }, update: { status: index === 0 ? "POSTED" : "PAID", paidAmount: paymentAmount.toFixed(2), outstanding: (Number(po.total) - paymentAmount).toFixed(2) }, create: { billNumber: billCode, purchaseOrderId: po.id, vendorId: po.vendorId, subtotal: po.subtotal, taxTotal: po.taxTotal, total: po.total, paidAmount: paymentAmount.toFixed(2), outstanding: (Number(po.total) - paymentAmount).toFixed(2), status: index === 0 ? "POSTED" : "PAID", journalEntryId: entry.id, items: { create: po.items.map((item) => ({ productId: item.productId, productSku: item.productSku, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, taxRate: item.taxRate, lineSubtotal: item.lineSubtotal, taxAmount: item.taxAmount, lineTotal: item.lineTotal })) } } });
    const paymentEntry = await prisma.journalEntry.upsert({ where: { entryNumber: `JE-PAY-DEMO-00${index + 1}` }, update: {}, create: { entryNumber: `JE-PAY-DEMO-00${index + 1}`, entryDate: new Date(), journalId: bankJournal.id, referenceType: "VENDOR_PAYMENT", referenceId: String(bill.id), description: `Demo vendor payment for ${billCode}`, status: "POSTED", lines: { create: [{ accountId: payable.id, debit: paymentAmount.toFixed(2), credit: 0 }, { accountId: bank.id, debit: 0, credit: paymentAmount.toFixed(2) }] } } });
    await prisma.payment.upsert({ where: { paymentNumber: `PAY-DEMO-00${index + 1}` }, update: { amount: paymentAmount.toFixed(2) }, create: { paymentNumber: `PAY-DEMO-00${index + 1}`, type: "VENDOR_PAYMENT", vendorBillId: bill.id, amount: paymentAmount.toFixed(2), paymentMethod: index === 0 ? "Bank Transfer" : "Cash", reference: `DEMO-REF-00${index + 1}`, journalEntryId: paymentEntry.id } });
  }

  const customer = await prisma.contact.findUniqueOrThrow({ where: { email: "accounts@priyadesign.demo" } });
  const salesItems = makeItems([{ product: chair, quantity: 6, unitPrice: "3500.00", taxRate: "18.00" }, { product: lamp, quantity: 4, unitPrice: "4200.00", taxRate: "12.00" }]);
  const salesSubtotal = salesItems.reduce((sum, item) => sum + Number(item.lineSubtotal), 0);
  const salesTax = salesItems.reduce((sum, item) => sum + Number(item.taxAmount), 0);
  await prisma.salesOrder.upsert({ where: { orderNumber: "SO-DEMO-001" }, update: { customerId: customer.id, status: "CONFIRMED", subtotal: salesSubtotal.toFixed(2), taxTotal: salesTax.toFixed(2), total: (salesSubtotal + salesTax).toFixed(2) }, create: { orderNumber: "SO-DEMO-001", customerId: customer.id, status: "CONFIRMED", subtotal: salesSubtotal.toFixed(2), taxTotal: salesTax.toFixed(2), total: (salesSubtotal + salesTax).toFixed(2), items: { create: salesItems } } });
  const salesOrder = await prisma.salesOrder.findUniqueOrThrow({ where: { orderNumber: "SO-DEMO-001" }, include: { items: true } });
  const salesJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "SAL" } });
  const receivable = await prisma.account.findUniqueOrThrow({ where: { code: "1100" } });
  const revenue = await prisma.account.findUniqueOrThrow({ where: { code: "4000" } });
  const salesEntry = await prisma.journalEntry.upsert({ where: { entryNumber: "JE-INV-DEMO-001" }, update: {}, create: { entryNumber: "JE-INV-DEMO-001", entryDate: new Date(), journalId: salesJournal.id, referenceType: "INVOICE", referenceId: "INV-DEMO-001", description: "Demo customer invoice", status: "POSTED", lines: { create: [{ accountId: receivable.id, debit: salesOrder.total, credit: 0 }, { accountId: revenue.id, debit: 0, credit: salesOrder.total }] } } });
  const demoInvoice = await prisma.invoice.upsert({ where: { invoiceNumber: "INV-DEMO-001" }, update: { status: "POSTED", paidAmount: "15000.00", outstanding: (Number(salesOrder.total) - 15000).toFixed(2), journalEntryId: salesEntry.id }, create: { invoiceNumber: "INV-DEMO-001", salesOrderId: salesOrder.id, customerId: customer.id, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), subtotal: salesOrder.subtotal, taxTotal: salesOrder.taxTotal, total: salesOrder.total, paidAmount: "15000.00", outstanding: (Number(salesOrder.total) - 15000).toFixed(2), journalEntryId: salesEntry.id, items: { create: salesOrder.items.map((item) => ({ productId: item.productId, productSku: item.productSku, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, taxRate: item.taxRate, lineSubtotal: item.lineSubtotal, taxAmount: item.taxAmount, lineTotal: item.lineTotal })) } } });
  const customerPaymentEntry = await prisma.journalEntry.upsert({ where: { entryNumber: "JE-CUS-PAY-DEMO-001" }, update: {}, create: { entryNumber: "JE-CUS-PAY-DEMO-001", entryDate: new Date(), journalId: bankJournal.id, referenceType: "CUSTOMER_PAYMENT", referenceId: String(demoInvoice.id), description: "Demo customer payment", status: "POSTED", lines: { create: [{ accountId: bank.id, debit: "15000.00", credit: 0 }, { accountId: receivable.id, debit: 0, credit: "15000.00" }] } } });
  await prisma.payment.upsert({ where: { paymentNumber: "PAY-CUSTOMER-DEMO-001" }, update: { amount: "15000.00" }, create: { paymentNumber: "PAY-CUSTOMER-DEMO-001", type: "CUSTOMER_PAYMENT", invoiceId: demoInvoice.id, amount: "15000.00", paymentMethod: "Bank Transfer", reference: "CUSTOMER-DEMO-001", journalEntryId: customerPaymentEntry.id } });
}
main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
