import { Prisma } from "@prisma/client";

export type TaxSnapshotInput = {
  taxableAmount: Prisma.Decimal;
  tax?: {
    id: number;
    name: string;
    rate: Prisma.Decimal | number;
    type: string;
  } | null;
  taxRate?: Prisma.Decimal | number;
  isInterState?: boolean;
};

export type CalculatedTaxLine = {
  taxId: number | null;
  taxName: string;
  taxType: string;
  rate: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  jurisdiction: string;
};

export const calculateItemTaxLines = (input: TaxSnapshotInput): {
  taxLines: CalculatedTaxLine[];
  totalTaxAmount: Prisma.Decimal;
} => {
  const taxableAmount = new Prisma.Decimal(input.taxableAmount);
  
  if (!input.tax && (!input.taxRate || Number(input.taxRate) === 0)) {
    return {
      taxLines: [],
      totalTaxAmount: new Prisma.Decimal(0)
    };
  }

  const taxType = input.tax?.type ?? "GST";
  const rateVal = input.tax ? new Prisma.Decimal(input.tax.rate) : new Prisma.Decimal(input.taxRate ?? 0);
  const taxId = input.tax?.id ?? null;
  const taxName = input.tax?.name ?? `GST ${rateVal}%`;

  if (rateVal.isZero()) {
    return {
      taxLines: [
        {
          taxId,
          taxName,
          taxType,
          rate: rateVal,
          taxableAmount,
          taxAmount: new Prisma.Decimal(0),
          jurisdiction: "EXEMPT"
        }
      ],
      totalTaxAmount: new Prisma.Decimal(0)
    };
  }

  if (taxType === "GST") {
    if (input.isInterState) {
      // Inter-State: 100% IGST
      const igstAmount = taxableAmount.mul(rateVal).div(100);
      return {
        taxLines: [
          {
            taxId,
            taxName: `${taxName} (IGST)`,
            taxType: "GST",
            rate: rateVal,
            taxableAmount,
            taxAmount: igstAmount,
            jurisdiction: "IGST"
          }
        ],
        totalTaxAmount: igstAmount
      };
    } else {
      // Intra-State: 50% CGST + 50% SGST
      const halfRate = rateVal.div(2);
      const halfAmount = taxableAmount.mul(halfRate).div(100);
      const totalAmount = taxableAmount.mul(rateVal).div(100);

      return {
        taxLines: [
          {
            taxId,
            taxName: `${taxName} (CGST)`,
            taxType: "GST",
            rate: halfRate,
            taxableAmount,
            taxAmount: halfAmount,
            jurisdiction: "CGST"
          },
          {
            taxId,
            taxName: `${taxName} (SGST)`,
            taxType: "GST",
            rate: halfRate,
            taxableAmount,
            taxAmount: halfAmount,
            jurisdiction: "SGST"
          }
        ],
        totalTaxAmount: totalAmount
      };
    }
  }

  // Other tax type (e.g. standard flat tax)
  const taxAmount = taxableAmount.mul(rateVal).div(100);
  return {
    taxLines: [
      {
        taxId,
        taxName,
        taxType,
        rate: rateVal,
        taxableAmount,
        taxAmount,
        jurisdiction: "STANDARD"
      }
    ],
    totalTaxAmount: taxAmount
  };
};
