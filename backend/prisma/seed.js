import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const roles = ["Admin", "Accountant", "Sales", "Purchase", "Viewer"];

async function main() {
  console.log("Seeding database with comprehensive 2025 & 2026 accounting data...");

  // 1. Roles & Users
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const accountantRole = await prisma.role.findUniqueOrThrow({ where: { name: "Accountant" } });
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@urbanfurniture.local" },
    update: { name: "System Administrator", loginId: "adminuser", passwordHash, roleId: adminRole.id, isActive: true },
    create: { name: "System Administrator", loginId: "adminuser", email: "admin@urbanfurniture.local", passwordHash, roleId: adminRole.id, isActive: true }
  });

  await prisma.user.upsert({
    where: { email: "accountant@urbanfurniture.local" },
    update: { name: "Priya Sharma (CFO)", loginId: "priyacfo", passwordHash, roleId: accountantRole.id, isActive: true },
    create: { name: "Priya Sharma (CFO)", loginId: "priyacfo", email: "accountant@urbanfurniture.local", passwordHash, roleId: accountantRole.id, isActive: true }
  });

  // 2. Chart of Accounts (COA)
  const accountsData = [
    { code: "1000", name: "Cash in Hand", type: "ASSET" },
    { code: "1010", name: "HDFC Bank Operating A/c", type: "ASSET" },
    { code: "1020", name: "ICICI Business A/c", type: "ASSET" },
    { code: "1100", name: "Trade Debtors (Receivables)", type: "ASSET" },
    { code: "1200", name: "Furniture Stock / Inventory", type: "ASSET" },
    { code: "1300", name: "GST Input Tax Credit", type: "ASSET" },
    { code: "2000", name: "Trade Creditors (Payables)", type: "LIABILITY" },
    { code: "2100", name: "GST Output Tax Payable", type: "LIABILITY" },
    { code: "3000", name: "Founder Share Capital", type: "CAPITAL" },
    { code: "4000", name: "Sales Revenue (Goods)", type: "INCOME" },
    { code: "4100", name: "Custom Interior & Assembly Income", type: "INCOME" },
    { code: "5000", name: "Raw Timber & Metal Purchases", type: "EXPENSE" },
    { code: "5100", name: "Cost of Goods Sold (COGS)", type: "EXPENSE" },
    { code: "6000", name: "Employee Salaries & Wages", type: "EXPENSE" },
    { code: "6100", name: "Showroom & Factory Rent", type: "EXPENSE" },
    { code: "6200", name: "Electricity & Power Utilities", type: "EXPENSE" },
    { code: "6300", name: "General & Administrative Expenses", type: "EXPENSE" },
  ];

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, type: acc.type, active: true },
      create: { code: acc.code, name: acc.name, type: acc.type, active: true }
    });
  }

  const bankAccount = await prisma.account.findUniqueOrThrow({ where: { code: "1010" } });
  const cashAccount = await prisma.account.findUniqueOrThrow({ where: { code: "1000" } });
  const salesAccount = await prisma.account.findUniqueOrThrow({ where: { code: "4000" } });
  const purchaseAccount = await prisma.account.findUniqueOrThrow({ where: { code: "5000" } });
  const generalAccount = await prisma.account.findUniqueOrThrow({ where: { code: "3000" } });
  const gstOutputAccount = await prisma.account.findUniqueOrThrow({ where: { code: "2100" } });
  const gstInputAccount = await prisma.account.findUniqueOrThrow({ where: { code: "1300" } });

  // 2b. Default GST Tax Master Entries
  const taxesData = [
    { name: "GST 0% (Exempt)", rate: 0.0, type: "GST" },
    { name: "GST 5%", rate: 5.0, type: "GST" },
    { name: "GST 12%", rate: 12.0, type: "GST" },
    { name: "GST 18%", rate: 18.0, type: "GST" },
    { name: "GST 28%", rate: 28.0, type: "GST" },
  ];

  for (const t of taxesData) {
    const existing = await prisma.tax.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.tax.create({
        data: {
          name: t.name,
          rate: t.rate,
          type: t.type,
          salesAccountId: gstOutputAccount.id,
          purchaseAccountId: gstInputAccount.id,
          isActive: true
        }
      });
    }
  }

  // 3. Journals with Default Accounts
  const journalsData = [
    { code: "SAL", name: "Customer Sales Journal", type: "SALES", defaultAccountId: salesAccount.id },
    { code: "PUR", name: "Vendor Purchase Journal", type: "PURCHASE", defaultAccountId: purchaseAccount.id },
    { code: "BNK", name: "Bank Journal (HDFC)", type: "BANK", defaultAccountId: bankAccount.id },
    { code: "CSH", name: "Cash Counter Journal", type: "CASH", defaultAccountId: cashAccount.id },
    { code: "GEN", name: "General Operations Journal", type: "GENERAL", defaultAccountId: generalAccount.id },
  ];

  for (const j of journalsData) {
    await prisma.journal.upsert({
      where: { code: j.code },
      update: { name: j.name, type: j.type, defaultAccountId: j.defaultAccountId, active: true },
      create: { code: j.code, name: j.name, type: j.type, defaultAccountId: j.defaultAccountId, active: true }
    });
  }

  // 4. Analytic Accounts
  const analyticAccountsData = [
    { name: "Commercial & Office Furnishings", type: "INCOME" },
    { name: "Luxury Residential Interiors", type: "INCOME" },
    { name: "Factory Timber Processing", type: "EXPENSE" },
    { name: "Showroom Marketing & Brand", type: "EXPENSE" },
    { name: "Corporate Operations & Admin", type: "EXPENSE" },
  ];

  const createdAnalytics = {};
  for (const item of analyticAccountsData) {
    const existing = await prisma.analyticAccount.findFirst({ where: { name: item.name } });
    if (existing) {
      createdAnalytics[item.name] = existing.id;
    } else {
      const created = await prisma.analyticAccount.create({ data: item });
      createdAnalytics[item.name] = created.id;
    }
  }

  // 5. Budgets for Previous Year (2025) and Current Year (2026)
  const budgetsData = [
    // 2025 Budgets (Previous Year)
    {
      name: "FY2025 Factory Materials Budget",
      period: "2025",
      plannedAmount: "1200000.00",
      responsiblePerson: "Rahul Sharma",
      analyticAccountId: createdAnalytics["Factory Timber Processing"]
    },
    {
      name: "FY2025 Showroom Campaign Budget",
      period: "2025",
      plannedAmount: "450000.00",
      responsiblePerson: "Pooja Patel",
      analyticAccountId: createdAnalytics["Showroom Marketing & Brand"]
    },
    {
      name: "FY2025 Admin & Facility Budget",
      period: "2025",
      plannedAmount: "300000.00",
      responsiblePerson: "Vikram Mehta",
      analyticAccountId: createdAnalytics["Corporate Operations & Admin"]
    },
    {
      name: "FY2025 Commercial Sales Target",
      period: "2025",
      plannedAmount: "2500000.00",
      responsiblePerson: "Ananya Roy",
      analyticAccountId: createdAnalytics["Commercial & Office Furnishings"]
    },
    // 2026 Budgets (Current Year)
    {
      name: "FY2026 Factory Materials Budget",
      period: "2026",
      plannedAmount: "1800000.00",
      responsiblePerson: "Rahul Sharma",
      analyticAccountId: createdAnalytics["Factory Timber Processing"]
    },
    {
      name: "FY2026 Showroom Marketing Budget",
      period: "2026",
      plannedAmount: "700000.00",
      responsiblePerson: "Pooja Patel",
      analyticAccountId: createdAnalytics["Showroom Marketing & Brand"]
    },
    {
      name: "FY2026 Corporate Operations Budget",
      period: "2026",
      plannedAmount: "500000.00",
      responsiblePerson: "Vikram Mehta",
      analyticAccountId: createdAnalytics["Corporate Operations & Admin"]
    },
    {
      name: "FY2026 Commercial Sales Target",
      period: "2026",
      plannedAmount: "3800000.00",
      responsiblePerson: "Ananya Roy",
      analyticAccountId: createdAnalytics["Commercial & Office Furnishings"]
    }
  ];

  for (const b of budgetsData) {
    const existing = await prisma.budget.findFirst({ where: { name: b.name } });
    if (existing) {
      await prisma.budget.update({ where: { id: existing.id }, data: b });
    } else {
      await prisma.budget.create({ data: b });
    }
  }

  // 6. Contacts
  const contactsData = [
    { name: "TimberCraft Wood Suppliers", email: "sales@timbercraft.demo", type: "VENDOR", phone: "+91 98765 10001", address: "Ahmedabad, Gujarat" },
    { name: "Apex Hardware & Fittings", email: "support@apexmetal.demo", type: "VENDOR", phone: "+91 98765 10002", address: "Rajkot, Gujarat" },
    { name: "Nova Velvet Fabrics Ltd", email: "orders@novafabric.demo", type: "VENDOR", phone: "+91 98765 10003", address: "Surat, Gujarat" },
    { name: "Skyline Tech Workspace", email: "procurement@skylinetech.demo", type: "CUSTOMER", phone: "+91 98765 20001", address: "Bengaluru, Karnataka" },
    { name: "Urban Retreat Apartments", email: "mgmt@urbanretreat.demo", type: "CUSTOMER", phone: "+91 98765 20002", address: "Mumbai, Maharashtra" },
    { name: "Nexus Design Architects", email: "billing@nexusdesign.demo", type: "BOTH", phone: "+91 98765 20003", address: "Pune, Maharashtra" },
  ];

  for (const c of contactsData) {
    await prisma.contact.upsert({
      where: { email: c.email },
      update: { ...c, active: true },
      create: { ...c, active: true }
    });
  }

  // 7. Products
  const productsData = [
    { sku: "UF-EXEC-001", name: "Ergo Executive Desk Chair", category: "Office Seating", type: "GOODS", unitPrice: "8500.00", costPrice: "4800.00", description: "Ergonomic mesh office chair with lumbar support" },
    { sku: "UF-CONF-002", name: "Solid Teak Conference Table", category: "Conference Tables", type: "GOODS", unitPrice: "42000.00", costPrice: "24000.00", description: "10-seater natural teak boardroom conference table" },
    { sku: "UF-SOFA-003", name: "Modena 3-Seater Velvet Sofa", category: "Living Room", type: "GOODS", unitPrice: "34000.00", costPrice: "19500.00", description: "Deep navy velvet 3-seater luxury lounge sofa" },
    { sku: "UF-WORK-004", name: "Dual Motor Standing Desk", category: "Desks & Workstations", type: "GOODS", unitPrice: "28500.00", costPrice: "16000.00", description: "Electric height-adjustable motorized desk" },
    { sku: "UF-SERV-005", name: "Onsite Interior Consultation & Fitting", category: "Services", type: "SERVICE", unitPrice: "7500.00", costPrice: "2000.00", description: "Professional layout planning and on-site furniture installation" },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { ...p, active: true },
      create: { ...p, active: true }
    });
  }

  // References for transactions
  const vendorTimber = await prisma.contact.findUniqueOrThrow({ where: { email: "sales@timbercraft.demo" } });
  const vendorApex = await prisma.contact.findUniqueOrThrow({ where: { email: "support@apexmetal.demo" } });
  const customerSkyline = await prisma.contact.findUniqueOrThrow({ where: { email: "procurement@skylinetech.demo" } });
  const customerRetreat = await prisma.contact.findUniqueOrThrow({ where: { email: "mgmt@urbanretreat.demo" } });
  const customerNexus = await prisma.contact.findUniqueOrThrow({ where: { email: "billing@nexusdesign.demo" } });

  const purJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "PUR" } });
  const salJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "SAL" } });
  const bnkJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "BNK" } });
  const cshJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "CSH" } });
  const genJournal = await prisma.journal.findUniqueOrThrow({ where: { code: "GEN" } });

  const accCash = await prisma.account.findUniqueOrThrow({ where: { code: "1000" } });
  const accBank = await prisma.account.findUniqueOrThrow({ where: { code: "1010" } });
  const accReceivable = await prisma.account.findUniqueOrThrow({ where: { code: "1100" } });
  const accPayable = await prisma.account.findUniqueOrThrow({ where: { code: "2000" } });
  const accCapital = await prisma.account.findUniqueOrThrow({ where: { code: "3000" } });
  const accRevenue = await prisma.account.findUniqueOrThrow({ where: { code: "4000" } });
  const accPurchases = await prisma.account.findUniqueOrThrow({ where: { code: "5000" } });
  const accSalaries = await prisma.account.findUniqueOrThrow({ where: { code: "6000" } });
  const accRent = await prisma.account.findUniqueOrThrow({ where: { code: "6100" } });
  const accUtilities = await prisma.account.findUniqueOrThrow({ where: { code: "6200" } });
  const accAdmin = await prisma.account.findUniqueOrThrow({ where: { code: "6300" } });

  // 8. Previous Year (2025) Transactions
  console.log("Seeding 2025 transactions (Previous Year)...");

  // Initial Capital Injection (2025-01-10): ₹2,000,000 in Bank, ₹2,000,000 in Capital
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-2025-CAP-001" },
    update: {},
    create: {
      entryNumber: "JE-2025-CAP-001",
      entryDate: new Date("2025-01-10T10:00:00.000Z"),
      journalId: genJournal.id,
      referenceType: "CAPITAL_INJECTION",
      description: "Initial Owner Equity & Capital Contribution",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "2000000.00", credit: "0.00" },
          { accountId: accCapital.id, debit: "0.00", credit: "2000000.00" }
        ]
      }
    }
  });

  // 2025 Sales Order & Invoice 1: Skyline Tech Hub (₹1,250,000)
  const so2025_1 = await prisma.salesOrder.upsert({
    where: { orderNumber: "SO-2025-001" },
    update: {},
    create: {
      orderNumber: "SO-2025-001",
      customerId: customerSkyline.id,
      status: "CONFIRMED",
      subtotal: "1250000.00",
      taxTotal: "0.00",
      total: "1250000.00",
      createdAt: new Date("2025-03-15T09:00:00.000Z")
    }
  });

  const jeInv2025_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-INV-2025-001" },
    update: {},
    create: {
      entryNumber: "JE-INV-2025-001",
      entryDate: new Date("2025-03-16T11:00:00.000Z"),
      journalId: salJournal.id,
      referenceType: "INVOICE",
      referenceId: "INV-2025-001",
      description: "Invoice for Corporate Office Furnishings - Skyline Tech",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accReceivable.id, partnerId: customerSkyline.id, debit: "1250000.00", credit: "0.00" },
          { accountId: accRevenue.id, debit: "0.00", credit: "1250000.00" }
        ]
      }
    }
  });

  const inv2025_1 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-001",
      salesOrderId: so2025_1.id,
      customerId: customerSkyline.id,
      dueDate: new Date("2025-04-15T11:00:00.000Z"),
      subtotal: "1250000.00",
      taxTotal: "0.00",
      total: "1250000.00",
      paidAmount: "1250000.00",
      outstanding: "0.00",
      status: "PAID",
      journalEntryId: jeInv2025_1.id,
      createdAt: new Date("2025-03-16T11:00:00.000Z")
    }
  });

  // Payment received for 2025 Invoice 1
  const jePay2025_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-PAY-2025-001" },
    update: {},
    create: {
      entryNumber: "JE-PAY-2025-001",
      entryDate: new Date("2025-03-25T14:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "CUSTOMER_PAYMENT",
      referenceId: String(inv2025_1.id),
      description: "Payment received from Skyline Tech",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "1250000.00", credit: "0.00" },
          { accountId: accReceivable.id, partnerId: customerSkyline.id, debit: "0.00", credit: "1250000.00" }
        ]
      }
    }
  });

  await prisma.payment.upsert({
    where: { paymentNumber: "PAY-CUS-2025-001" },
    update: {},
    create: {
      paymentNumber: "PAY-CUS-2025-001",
      type: "CUSTOMER_PAYMENT",
      invoiceId: inv2025_1.id,
      amount: "1250000.00",
      paymentMethod: "Bank Transfer",
      reference: "HDFC-NEFT-2025-001",
      journalEntryId: jePay2025_1.id,
      createdAt: new Date("2025-03-25T14:00:00.000Z")
    }
  });

  // 2025 Sales Order & Invoice 2: Urban Retreat (₹780,000)
  const so2025_2 = await prisma.salesOrder.upsert({
    where: { orderNumber: "SO-2025-002" },
    update: {},
    create: {
      orderNumber: "SO-2025-002",
      customerId: customerRetreat.id,
      status: "CONFIRMED",
      subtotal: "780000.00",
      taxTotal: "0.00",
      total: "780000.00",
      createdAt: new Date("2025-08-10T10:00:00.000Z")
    }
  });

  const jeInv2025_2 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-INV-2025-002" },
    update: {},
    create: {
      entryNumber: "JE-INV-2025-002",
      entryDate: new Date("2025-08-11T12:00:00.000Z"),
      journalId: salJournal.id,
      referenceType: "INVOICE",
      referenceId: "INV-2025-002",
      description: "Apartment Lobby & Lounge Interior Suites",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accReceivable.id, partnerId: customerRetreat.id, debit: "780000.00", credit: "0.00" },
          { accountId: accRevenue.id, debit: "0.00", credit: "780000.00" }
        ]
      }
    }
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2025-002" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-002",
      salesOrderId: so2025_2.id,
      customerId: customerRetreat.id,
      dueDate: new Date("2025-09-10T12:00:00.000Z"),
      subtotal: "780000.00",
      taxTotal: "0.00",
      total: "780000.00",
      paidAmount: "600000.00",
      outstanding: "180000.00",
      status: "POSTED",
      journalEntryId: jeInv2025_2.id,
      createdAt: new Date("2025-08-11T12:00:00.000Z")
    }
  });

  // Partial customer receipt ₹600,000 in bank
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-PAY-2025-002" },
    update: {},
    create: {
      entryNumber: "JE-PAY-2025-002",
      entryDate: new Date("2025-08-20T15:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "CUSTOMER_PAYMENT",
      referenceId: "INV-2025-002",
      description: "Partial settlement from Urban Retreat",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "600000.00", credit: "0.00" },
          { accountId: accReceivable.id, partnerId: customerRetreat.id, debit: "0.00", credit: "600000.00" }
        ]
      }
    }
  });

  // 2025 Purchase Order 1 & Vendor Bill: TimberCraft (₹650,000)
  const po2025_1 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: "PO-2025-001" },
    update: {},
    create: {
      orderNumber: "PO-2025-001",
      vendorId: vendorTimber.id,
      status: "CONFIRMED",
      subtotal: "650000.00",
      taxTotal: "0.00",
      total: "650000.00",
      orderDate: new Date("2025-02-14T09:00:00.000Z"),
      createdAt: new Date("2025-02-14T09:00:00.000Z")
    }
  });

  const jeBill2025_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VB-2025-001" },
    update: {},
    create: {
      entryNumber: "JE-VB-2025-001",
      entryDate: new Date("2025-02-15T11:00:00.000Z"),
      journalId: purJournal.id,
      referenceType: "VENDOR_BILL",
      referenceId: "VB-2025-001",
      description: "Grade-A Seasoned Teak Wood Logs Purchase",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPurchases.id, debit: "650000.00", credit: "0.00" },
          { accountId: accPayable.id, partnerId: vendorTimber.id, debit: "0.00", credit: "650000.00" }
        ]
      }
    }
  });

  const vb2025_1 = await prisma.vendorBill.upsert({
    where: { billNumber: "VB-2025-001" },
    update: {},
    create: {
      billNumber: "VB-2025-001",
      purchaseOrderId: po2025_1.id,
      vendorId: vendorTimber.id,
      subtotal: "650000.00",
      taxTotal: "0.00",
      total: "650000.00",
      paidAmount: "650000.00",
      outstanding: "0.00",
      status: "PAID",
      journalEntryId: jeBill2025_1.id,
      createdAt: new Date("2025-02-15T11:00:00.000Z")
    }
  });

  // Full payment to TimberCraft via Bank
  const jeVPay2025_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VPAY-2025-001" },
    update: {},
    create: {
      entryNumber: "JE-VPAY-2025-001",
      entryDate: new Date("2025-02-28T16:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "VENDOR_PAYMENT",
      referenceId: String(vb2025_1.id),
      description: "Payment to TimberCraft for wood logs",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPayable.id, partnerId: vendorTimber.id, debit: "650000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "650000.00" }
        ]
      }
    }
  });

  await prisma.payment.upsert({
    where: { paymentNumber: "PAY-VEN-2025-001" },
    update: {},
    create: {
      paymentNumber: "PAY-VEN-2025-001",
      type: "VENDOR_PAYMENT",
      vendorBillId: vb2025_1.id,
      amount: "650000.00",
      paymentMethod: "Bank Transfer",
      reference: "RTGS-TIMBER-001",
      journalEntryId: jeVPay2025_1.id,
      createdAt: new Date("2025-02-28T16:00:00.000Z")
    }
  });

  // 2025 Purchase Order 2 & Bill: Apex Hardware (₹320,000)
  const po2025_2 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: "PO-2025-002" },
    update: {},
    create: {
      orderNumber: "PO-2025-002",
      vendorId: vendorApex.id,
      status: "CONFIRMED",
      subtotal: "320000.00",
      taxTotal: "0.00",
      total: "320000.00",
      orderDate: new Date("2025-06-18T10:00:00.000Z"),
      createdAt: new Date("2025-06-18T10:00:00.000Z")
    }
  });

  const jeBill2025_2 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VB-2025-002" },
    update: {},
    create: {
      entryNumber: "JE-VB-2025-002",
      entryDate: new Date("2025-06-20T11:30:00.000Z"),
      journalId: purJournal.id,
      referenceType: "VENDOR_BILL",
      referenceId: "VB-2025-002",
      description: "Heavy Duty Hinges and Sliding Channels",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPurchases.id, debit: "320000.00", credit: "0.00" },
          { accountId: accPayable.id, partnerId: vendorApex.id, debit: "0.00", credit: "320000.00" }
        ]
      }
    }
  });

  await prisma.vendorBill.upsert({
    where: { billNumber: "VB-2025-002" },
    update: {},
    create: {
      billNumber: "VB-2025-002",
      purchaseOrderId: po2025_2.id,
      vendorId: vendorApex.id,
      subtotal: "320000.00",
      taxTotal: "0.00",
      total: "320000.00",
      paidAmount: "200000.00",
      outstanding: "120000.00",
      status: "POSTED",
      journalEntryId: jeBill2025_2.id,
      createdAt: new Date("2025-06-20T11:30:00.000Z")
    }
  });

  // Partial payment to Apex ₹200,000 via Bank
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VPAY-2025-002" },
    update: {},
    create: {
      entryNumber: "JE-VPAY-2025-002",
      entryDate: new Date("2025-07-02T14:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "VENDOR_PAYMENT",
      referenceId: "VB-2025-002",
      description: "Advance part payment to Apex Hardware",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPayable.id, partnerId: vendorApex.id, debit: "200000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "200000.00" }
        ]
      }
    }
  });

  // 2025 Operating Expenses (Salaries, Rent, Utilities)
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2025-SAL" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2025-SAL",
      entryDate: new Date("2025-11-30T17:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "EXPENSES",
      description: "Annual Staff Salaries & Workshop Wages (2025)",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accSalaries.id, debit: "420000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "420000.00" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2025-RENT" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2025-RENT",
      entryDate: new Date("2025-12-15T10:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "EXPENSES",
      description: "Showroom and Factory Annual Lease (2025)",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accRent.id, debit: "180000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "180000.00" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2025-UTIL" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2025-UTIL",
      entryDate: new Date("2025-12-20T12:00:00.000Z"),
      journalId: cshJournal.id,
      referenceType: "EXPENSES",
      description: "Power, Sawmill Electricity & Workshop Utilities (2025)",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accUtilities.id, debit: "65000.00", credit: "0.00" },
          { accountId: accCash.id, debit: "0.00", credit: "65000.00" }
        ]
      }
    }
  });

  // 9. Current Year (2026) Transactions
  console.log("Seeding 2026 transactions (Current Year)...");

  // Additional Capital Inflow in Jan 2026: ₹1,000,000
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-2026-CAP-001" },
    update: {},
    create: {
      entryNumber: "JE-2026-CAP-001",
      entryDate: new Date("2026-01-05T10:00:00.000Z"),
      journalId: genJournal.id,
      referenceType: "CAPITAL_INJECTION",
      description: "Expansion Equity Capital Contribution",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "1000000.00", credit: "0.00" },
          { accountId: accCapital.id, debit: "0.00", credit: "1000000.00" }
        ]
      }
    }
  });

  // 2026 Sales Order & Invoice 1: Nexus Design Architects (₹890,000)
  const so2026_1 = await prisma.salesOrder.upsert({
    where: { orderNumber: "SO-2026-001" },
    update: {},
    create: {
      orderNumber: "SO-2026-001",
      customerId: customerNexus.id,
      status: "CONFIRMED",
      subtotal: "890000.00",
      taxTotal: "0.00",
      total: "890000.00",
      createdAt: new Date("2026-01-20T10:00:00.000Z")
    }
  });

  const jeInv2026_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-INV-2026-001" },
    update: {},
    create: {
      entryNumber: "JE-INV-2026-001",
      entryDate: new Date("2026-01-22T11:00:00.000Z"),
      journalId: salJournal.id,
      referenceType: "INVOICE",
      referenceId: "INV-2026-001",
      description: "Executive Suites & Conference Pods - Nexus Project",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accReceivable.id, partnerId: customerNexus.id, debit: "890000.00", credit: "0.00" },
          { accountId: accRevenue.id, debit: "0.00", credit: "890000.00" }
        ]
      }
    }
  });

  const inv2026_1 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2026-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2026-001",
      salesOrderId: so2026_1.id,
      customerId: customerNexus.id,
      dueDate: new Date("2026-02-22T11:00:00.000Z"),
      subtotal: "890000.00",
      taxTotal: "0.00",
      total: "890000.00",
      paidAmount: "650000.00",
      outstanding: "240000.00",
      status: "POSTED",
      journalEntryId: jeInv2026_1.id,
      createdAt: new Date("2026-01-22T11:00:00.000Z")
    }
  });

  // Customer payment received in Bank: ₹650,000
  const jePay2026_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-PAY-2026-001" },
    update: {},
    create: {
      entryNumber: "JE-PAY-2026-001",
      entryDate: new Date("2026-02-05T14:30:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "CUSTOMER_PAYMENT",
      referenceId: String(inv2026_1.id),
      description: "Bank transfer from Nexus Design",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "650000.00", credit: "0.00" },
          { accountId: accReceivable.id, partnerId: customerNexus.id, debit: "0.00", credit: "650000.00" }
        ]
      }
    }
  });

  await prisma.payment.upsert({
    where: { paymentNumber: "PAY-CUS-2026-001" },
    update: {},
    create: {
      paymentNumber: "PAY-CUS-2026-001",
      type: "CUSTOMER_PAYMENT",
      invoiceId: inv2026_1.id,
      amount: "650000.00",
      paymentMethod: "Bank Transfer",
      reference: "IMPS-NEXUS-026",
      journalEntryId: jePay2026_1.id,
      createdAt: new Date("2026-02-05T14:30:00.000Z")
    }
  });

  // 2026 Sales Order & Invoice 2: Skyline Tech Expansion (₹420,000)
  const so2026_2 = await prisma.salesOrder.upsert({
    where: { orderNumber: "SO-2026-002" },
    update: {},
    create: {
      orderNumber: "SO-2026-002",
      customerId: customerSkyline.id,
      status: "CONFIRMED",
      subtotal: "420000.00",
      taxTotal: "0.00",
      total: "420000.00",
      createdAt: new Date("2026-02-15T09:30:00.000Z")
    }
  });

  const jeInv2026_2 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-INV-2026-002" },
    update: {},
    create: {
      entryNumber: "JE-INV-2026-002",
      entryDate: new Date("2026-02-16T12:00:00.000Z"),
      journalId: salJournal.id,
      referenceType: "INVOICE",
      referenceId: "INV-2026-002",
      description: "Ergonomic Chairs and Acoustic Workstations",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accReceivable.id, partnerId: customerSkyline.id, debit: "420000.00", credit: "0.00" },
          { accountId: accRevenue.id, debit: "0.00", credit: "420000.00" }
        ]
      }
    }
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2026-002" },
    update: {},
    create: {
      invoiceNumber: "INV-2026-002",
      salesOrderId: so2026_2.id,
      customerId: customerSkyline.id,
      dueDate: new Date("2026-03-18T12:00:00.000Z"),
      subtotal: "420000.00",
      taxTotal: "0.00",
      total: "420000.00",
      paidAmount: "420000.00",
      outstanding: "0.00",
      status: "PAID",
      journalEntryId: jeInv2026_2.id,
      createdAt: new Date("2026-02-16T12:00:00.000Z")
    }
  });

  // Customer payment in cash: ₹150,000 + bank: ₹270,000
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-PAY-2026-002" },
    update: {},
    create: {
      entryNumber: "JE-PAY-2026-002",
      entryDate: new Date("2026-02-20T16:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "CUSTOMER_PAYMENT",
      referenceId: "INV-2026-002",
      description: "Full settlement for invoice INV-2026-002",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accBank.id, debit: "270000.00", credit: "0.00" },
          { accountId: accCash.id, debit: "150000.00", credit: "0.00" },
          { accountId: accReceivable.id, partnerId: customerSkyline.id, debit: "0.00", credit: "420000.00" }
        ]
      }
    }
  });

  // 2026 Purchase Order 1 & Bill: TimberCraft (₹450,000)
  const po2026_1 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: "PO-2026-001" },
    update: {},
    create: {
      orderNumber: "PO-2026-001",
      vendorId: vendorTimber.id,
      status: "CONFIRMED",
      subtotal: "450000.00",
      taxTotal: "0.00",
      total: "450000.00",
      orderDate: new Date("2026-01-18T10:00:00.000Z"),
      createdAt: new Date("2026-01-18T10:00:00.000Z")
    }
  });

  const jeBill2026_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VB-2026-001" },
    update: {},
    create: {
      entryNumber: "JE-VB-2026-001",
      entryDate: new Date("2026-01-19T11:00:00.000Z"),
      journalId: purJournal.id,
      referenceType: "VENDOR_BILL",
      referenceId: "VB-2026-001",
      description: "Kiln-dried hardwood planks and veneer sheets",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPurchases.id, debit: "450000.00", credit: "0.00" },
          { accountId: accPayable.id, partnerId: vendorTimber.id, debit: "0.00", credit: "450000.00" }
        ]
      }
    }
  });

  const vb2026_1 = await prisma.vendorBill.upsert({
    where: { billNumber: "VB-2026-001" },
    update: {},
    create: {
      billNumber: "VB-2026-001",
      purchaseOrderId: po2026_1.id,
      vendorId: vendorTimber.id,
      subtotal: "450000.00",
      taxTotal: "0.00",
      total: "450000.00",
      paidAmount: "450000.00",
      outstanding: "0.00",
      status: "PAID",
      journalEntryId: jeBill2026_1.id,
      createdAt: new Date("2026-01-19T11:00:00.000Z")
    }
  });

  // Paid in full via Bank
  const jeVPay2026_1 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VPAY-2026-001" },
    update: {},
    create: {
      entryNumber: "JE-VPAY-2026-001",
      entryDate: new Date("2026-01-28T14:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "VENDOR_PAYMENT",
      referenceId: String(vb2026_1.id),
      description: "Full payment to TimberCraft for planks",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPayable.id, partnerId: vendorTimber.id, debit: "450000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "450000.00" }
        ]
      }
    }
  });

  await prisma.payment.upsert({
    where: { paymentNumber: "PAY-VEN-2026-001" },
    update: {},
    create: {
      paymentNumber: "PAY-VEN-2026-001",
      type: "VENDOR_PAYMENT",
      vendorBillId: vb2026_1.id,
      amount: "450000.00",
      paymentMethod: "Bank Transfer",
      reference: "HDFC-RTGS-TIMBER-026",
      journalEntryId: jeVPay2026_1.id,
      createdAt: new Date("2026-01-28T14:00:00.000Z")
    }
  });

  // 2026 Purchase Order 2 & Bill: Apex Hardware (₹280,000)
  const po2026_2 = await prisma.purchaseOrder.upsert({
    where: { orderNumber: "PO-2026-002" },
    update: {},
    create: {
      orderNumber: "PO-2026-002",
      vendorId: vendorApex.id,
      status: "CONFIRMED",
      subtotal: "280000.00",
      taxTotal: "0.00",
      total: "280000.00",
      orderDate: new Date("2026-02-10T11:00:00.000Z"),
      createdAt: new Date("2026-02-10T11:00:00.000Z")
    }
  });

  const jeBill2026_2 = await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VB-2026-002" },
    update: {},
    create: {
      entryNumber: "JE-VB-2026-002",
      entryDate: new Date("2026-02-11T14:00:00.000Z"),
      journalId: purJournal.id,
      referenceType: "VENDOR_BILL",
      referenceId: "VB-2026-002",
      description: "Powder coated frames and handles",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPurchases.id, debit: "280000.00", credit: "0.00" },
          { accountId: accPayable.id, partnerId: vendorApex.id, debit: "0.00", credit: "280000.00" }
        ]
      }
    }
  });

  await prisma.vendorBill.upsert({
    where: { billNumber: "VB-2026-002" },
    update: {},
    create: {
      billNumber: "VB-2026-002",
      purchaseOrderId: po2026_2.id,
      vendorId: vendorApex.id,
      subtotal: "280000.00",
      taxTotal: "0.00",
      total: "280000.00",
      paidAmount: "130000.00",
      outstanding: "150000.00",
      status: "POSTED",
      journalEntryId: jeBill2026_2.id,
      createdAt: new Date("2026-02-11T14:00:00.000Z")
    }
  });

  // Part payment ₹130,000 to Apex (Bank: ₹100,000, Cash: ₹30,000)
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-VPAY-2026-002" },
    update: {},
    create: {
      entryNumber: "JE-VPAY-2026-002",
      entryDate: new Date("2026-02-18T16:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "VENDOR_PAYMENT",
      referenceId: "VB-2026-002",
      description: "Part payment to Apex Hardware",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accPayable.id, partnerId: vendorApex.id, debit: "130000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "100000.00" },
          { accountId: accCash.id, debit: "0.00", credit: "30000.00" }
        ]
      }
    }
  });

  // 2026 Operating Expenses
  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2026-SAL" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2026-SAL",
      entryDate: new Date("2026-02-28T18:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "EXPENSES",
      description: "Q1 Workshop & Staff Salaries (2026)",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accSalaries.id, debit: "240000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "240000.00" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2026-RENT" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2026-RENT",
      entryDate: new Date("2026-02-28T18:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "EXPENSES",
      description: "Q1 Showroom Lease (2026)",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accRent.id, debit: "90000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "90000.00" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2026-UTIL" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2026-UTIL",
      entryDate: new Date("2026-03-01T10:00:00.000Z"),
      journalId: cshJournal.id,
      referenceType: "EXPENSES",
      description: "Monthly Factory Power & Utilities",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accUtilities.id, debit: "35000.00", credit: "0.00" },
          { accountId: accCash.id, debit: "0.00", credit: "35000.00" }
        ]
      }
    }
  });

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-EXP-2026-ADMIN" },
    update: {},
    create: {
      entryNumber: "JE-EXP-2026-ADMIN",
      entryDate: new Date("2026-03-02T11:00:00.000Z"),
      journalId: bnkJournal.id,
      referenceType: "EXPENSES",
      description: "Software Subscriptions & Office Supplies",
      status: "POSTED",
      lines: {
        create: [
          { accountId: accAdmin.id, debit: "25000.00", credit: "0.00" },
          { accountId: accBank.id, debit: "0.00", credit: "25000.00" }
        ]
      }
    }
  });

  console.log("Database seeded successfully with 2025 & 2026 financial records!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
