import type {
  BalanceSheetData,
  BudgetReportData,
  ProfitLossData,
} from "../api/reports.api";

type ReportType = "profit-loss" | "balance-sheet" | "budget";

const money = (value: number | string | undefined | null) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character]!
  );

const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));

const accountRows = (
  items: Array<{
    code?: string;
    name: string;
    amount?: number;
    balance?: number;
  }>
) =>
  items.length
    ? items
        .map(
          (item) => `
            <tr>
              <td>
                ${
                  item.code
                    ? `<span class="code">${escapeHtml(item.code)}</span> `
                    : ""
                }
                ${escapeHtml(item.name)}
              </td>

              <td class="amount">
                ${money(item.amount ?? item.balance ?? 0)}
              </td>
            </tr>
          `
        )
        .join("")
    : `
        <tr>
          <td colspan="2" class="empty">
            No posted account activity for this period.
          </td>
        </tr>
      `;

const getReportContent = ({
  report,
  year,
  profitLoss,
  balanceSheet,
  budget,
}: {
  report: ReportType;
  year: string;
  profitLoss?: ProfitLossData;
  balanceSheet?: BalanceSheetData;
  budget?: BudgetReportData;
}) => {
  /* ================= PROFIT & LOSS ================= */

  if (report === "profit-loss" && profitLoss) {
    const totalIncome =
      Number(profitLoss.totals.totalIncome) || 0;

    const totalExpense =
      Number(profitLoss.totals.totalExpense) || 0;

    const netProfit =
      Number(profitLoss.totals.netProfit) ||
      totalIncome - totalExpense;

    return {
      title: "Statement of Profit and Loss",

      period: `${formatDate(
        profitLoss.period.start
      )} to ${formatDate(profitLoss.period.end)}`,

      body: `
        <section>
          <h2>Income</h2>

          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th class="amount">
                  Amount (INR)
                </th>
              </tr>
            </thead>

            <tbody>
              ${accountRows(profitLoss.income)}

              <tr class="subtotal">
                <td>Total Income</td>

                <td class="amount">
                  ${money(totalIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Expenses</h2>

          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th class="amount">
                  Amount (INR)
                </th>
              </tr>
            </thead>

            <tbody>
              ${accountRows(profitLoss.expenses)}

              <tr class="subtotal">
                <td>Total Expenses</td>

                <td class="amount">
                  ${money(totalExpense)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section
          class="result ${
            netProfit >= 0 ? "profit" : "loss"
          }"
        >
          <span>
            Net ${netProfit >= 0 ? "Profit" : "Loss"}
          </span>

          <strong>
            ${money(Math.abs(netProfit))}
          </strong>
        </section>
      `,
    };
  }

  /* ================= BALANCE SHEET ================= */

  if (report === "balance-sheet" && balanceSheet) {
    return {
      title: "Balance Sheet",

      period: `As at ${formatDate(
        balanceSheet.asOfDate
      )}`,

      body: `
        <div class="columns">

          <!-- ASSETS -->

          <section>
            <h2>Assets</h2>

            <table>
              <thead>
                <tr>
                  <th>Account</th>

                  <th class="amount">
                    Amount (INR)
                  </th>
                </tr>
              </thead>

              <tbody>
                ${accountRows(balanceSheet.assets)}

                <tr class="subtotal">
                  <td>Total Assets</td>

                  <td class="amount">
                    ${money(
                      balanceSheet.totals.assets
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- LIABILITIES -->

          <section>
            <h2>Liabilities</h2>

            <table>
              <thead>
                <tr>
                  <th>Account</th>

                  <th class="amount">
                    Amount (INR)
                  </th>
                </tr>
              </thead>

              <tbody>
                ${accountRows(
                  balanceSheet.liabilities
                )}

                <tr class="subtotal">
                  <td>Total Liabilities</td>

                  <td class="amount">
                    ${money(
                      balanceSheet.totals.liabilities
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <h2>
              Equity & Retained Earnings
            </h2>

            <table>
              <tbody>
                ${accountRows(
                  balanceSheet.capital
                )}

                <tr class="subtotal">
                  <td>Total Equity</td>

                  <td class="amount">
                    ${money(
                      balanceSheet.totals.capital
                    )}
                  </td>
                </tr>

                <tr class="grand-total">
                  <td>
                    Total Liabilities & Equity
                  </td>

                  <td class="amount">
                    ${money(
                      balanceSheet.totals
                        .totalLiabilitiesAndCapital
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

        </div>

        <div class="note">
          <strong>
            Accounting Equation:
          </strong>

          Assets
          ${money(
            balanceSheet.totals.assets
          )}

          =

          Liabilities & Equity
          ${money(
            balanceSheet.totals
              .totalLiabilitiesAndCapital
          )}
        </div>
      `,
    };
  }

  /* ================= BUDGET REPORT ================= */

  if (report === "budget" && budget) {
    const budgetRows = budget.data
      .map((item) => {
        const planned =
          Number(item.plannedAmount) || 0;

        const achieved =
          Number(item.achievedAmount) || 0;

        const variance =
          planned - achieved;

        return `
          <tr>

            <td>
              ${escapeHtml(item.name)}
            </td>

            <td>
              ${escapeHtml(item.period)}
            </td>

            <td>
              ${escapeHtml(
                item.analyticAccount
              )}
            </td>

            <td class="amount">
              ${money(planned)}
            </td>

            <td class="amount">
              ${money(achieved)}
            </td>

            <td class="amount">
              ${money(variance)}
            </td>

            <td class="amount">
              ${Number(
                item.percentage || 0
              ).toFixed(1)}%
            </td>

          </tr>
        `;
      })
      .join("");

    const totalPlanned =
      Number(budget.totals.totalPlanned) || 0;

    const totalAchieved =
      Number(budget.totals.totalAchieved) || 0;

    return {
      title: "Budget Performance Report",

      period: `Financial year ${year}`,

      body: `
        <section>

          <table>

            <thead>
              <tr>
                <th>Budget</th>
                <th>Period</th>
                <th>Analytic Account</th>

                <th class="amount">
                  Planned
                </th>

                <th class="amount">
                  Actual
                </th>

                <th class="amount">
                  Variance
                </th>

                <th class="amount">
                  Variance %
                </th>
              </tr>
            </thead>

            <tbody>

              ${
                budgetRows ||
                `
                  <tr>
                    <td
                      colspan="7"
                      class="empty"
                    >
                      No budgets are available
                      for this period.
                    </td>
                  </tr>
                `
              }

              <tr class="subtotal">

                <td colspan="3">
                  Total
                </td>

                <td class="amount">
                  ${money(totalPlanned)}
                </td>

                <td class="amount">
                  ${money(totalAchieved)}
                </td>

                <td class="amount">
                  ${money(
                    totalPlanned -
                      totalAchieved
                  )}
                </td>

                <td></td>

              </tr>

            </tbody>

          </table>

        </section>

        <div class="note">

          Actual amounts are derived from
          posted journal data assigned to
          each analytic account.

          A positive variance represents
          remaining budget.

        </div>
      `,
    };
  }

  return null;
};

/* ========================================================= */
/* OPEN REPORT DOCUMENT                                      */
/* ========================================================= */

export const openReportDocument = ({
  report,
  year,
  profitLoss,
  balanceSheet,
  budget,
}: {
  report: ReportType;
  year: string;
  profitLoss?: ProfitLossData;
  balanceSheet?: BalanceSheetData;
  budget?: BudgetReportData;
}) => {
  const content = getReportContent({
    report,
    year,
    profitLoss,
    balanceSheet,
    budget,
  });

  if (!content) {
    console.error(
      "Unable to generate report: data is unavailable."
    );

    return;
  }

  const generatedOn =
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

  /*
   * Open exactly ONE popup.
   */
  const popup = window.open("", "_blank");

  if (!popup) {
    alert(
      "Unable to open the report. Please allow pop-ups for this site."
    );

    return;
  }

  popup.document.open();

  popup.document.write(`
    <!doctype html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          ${escapeHtml(
            content.title
          )}
          - Urban Furniture
        </title>

        <style>

          @page {
            size: A4;
            margin: 16mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #172033;

            font-size: 11px;

            margin: 0;

            padding:
              0 0 35px 0;
          }

          .header {
            display: flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            border-bottom:
              3px solid #2563eb;

            padding-bottom: 14px;

            margin-bottom: 20px;
          }

          .brand {
            font-size: 19px;

            font-weight: 800;

            color: #1e3a8a;

            letter-spacing:
              0.4px;
          }

          .muted {
            color: #64748b;
          }

          .title {
            font-size: 22px;

            font-weight: 700;

            margin:
              0 0 5px 0;

            color: #0f172a;
          }

          h2 {
            font-size: 13px;

            color: #1e3a8a;

            border-bottom:
              1px solid #cbd5e1;

            padding-bottom: 6px;

            margin:
              22px 0 8px;
          }

          table {
            width: 100%;

            border-collapse:
              collapse;
          }

          th {
            background: #eff6ff;

            color: #1e3a8a;

            text-align: left;

            padding: 8px;

            border:
              1px solid #cbd5e1;

            font-size: 10px;
          }

          td {
            padding:
              7px 8px;

            border:
              1px solid #dbe3ee;

            vertical-align:
              top;
          }

          .amount {
            text-align: right;

            font-variant-numeric:
              tabular-nums;

            white-space:
              nowrap;
          }

          .code {
            color: #64748b;

            font-size: 10px;
          }

          .subtotal td {
            font-weight: 700;

            background:
              #f8fafc;
          }

          .grand-total td {
            font-weight: 800;

            background:
              #e2e8f0;
          }

          .result {
            display: flex;

            justify-content:
              space-between;

            align-items:
              center;

            margin-top: 18px;

            padding: 12px;

            font-size: 14px;

            font-weight: 700;
          }

          .result.profit {
            background:
              #dcfce7;

            color:
              #166534;

            border:
              1px solid #86efac;
          }

          .result.loss {
            background:
              #fee2e2;

            color:
              #991b1b;

            border:
              1px solid #fca5a5;
          }

          .columns {
            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap: 18px;
          }

          .note {
            margin-top: 18px;

            padding: 10px;

            background:
              #f8fafc;

            border-left:
              3px solid #2563eb;

            color:
              #475569;
          }

          .empty {
            text-align: center;

            color:
              #64748b;

            padding: 18px;
          }

          .footer {
            position: fixed;

            bottom: 0;

            left: 0;

            right: 0;

            border-top:
              1px solid #cbd5e1;

            padding-top: 7px;

            color:
              #64748b;

            font-size: 9px;

            display: flex;

            justify-content:
              space-between;
          }

          .signatures {
            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap: 60px;

            margin-top: 55px;
          }

          .signature {
            border-top:
              1px solid #64748b;

            padding-top: 7px;

            color:
              #475569;
          }

          @media print {

            .footer {
              position: fixed;
            }

          }

          @media screen and
            (max-width: 700px) {

            .columns {
              grid-template-columns:
                1fr;
            }

          }

        </style>

      </head>

      <body>

        <header class="header">

          <div>

            <div class="brand">
              URBAN FURNITURE
            </div>

            <div class="muted">
              Accounting System ·
              Management Financial Report
            </div>

          </div>

          <div
            class="muted"
            style="text-align:right"
          >

            Generated:
            ${escapeHtml(generatedOn)}

            <br />

            Currency:
            Indian Rupees (INR)

          </div>

        </header>

        <h1 class="title">
          ${escapeHtml(
            content.title
          )}
        </h1>

        <div class="muted">
          ${escapeHtml(
            content.period
          )}
        </div>

        ${content.body}

        <div class="signatures">

          <div class="signature">
            Prepared by:
            System Administrator
          </div>

          <div class="signature">
            Reviewed / Approved by
          </div>

        </div>

        <footer class="footer">

          <span>
            Urban Furniture Accounting System
            · Confidential
          </span>

          <span>
            ${escapeHtml(year)}
          </span>

        </footer>

      </body>

    </html>
  `);

  popup.document.close();

  /*
   * IMPORTANT:
   *
   * There is ONLY ONE print trigger.
   *
   * We wait for the popup to finish loading,
   * then open the print dialog once.
   */
  popup.onload = () => {
    popup.focus();  

    setTimeout(() => {
      popup.print();
    }, 200);
  };
};