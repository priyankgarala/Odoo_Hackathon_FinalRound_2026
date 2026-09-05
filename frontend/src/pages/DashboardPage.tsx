import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Stack,
  Typography,
  Popover,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as soApi from "../api/sales-orders.api";
import * as poApi from "../api/purchase-orders.api";
import * as budgetApi from "../api/budgets.api";

const COLORS = {
  page: "#0B1220",
  card: "#111B2E",
  cardHover: "#16233A",
  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(148, 163, 184, 0.28)",

  text: "#F1F5F9",
  muted: "#94A3B8",

  accent: "#4DB6AC",
  accentHover: "#3F9E96",
  accentSoft: "rgba(77, 182, 172, 0.12)",

  success: "#6FCF97",
  successSoft: "rgba(111, 207, 151, 0.12)",
};

const menuData = {
  Sales: [
    { label: "Sales Order", to: "/sales-orders" },
    { label: "Sale Invoice", to: "/invoices" },
    { label: "Receipt", to: "/invoices" },
  ],

  Purchase: [
    { label: "Purchase Order", to: "/purchase-orders" },
    { label: "Purchase Bill", to: "/vendor-bills" },
    { label: "Payment", to: "/vendor-bills" },
  ],

  Account: [
    { label: "Contact", to: "/contacts" },
    { label: "Product", to: "/products" },
    { label: "Analyticals", to: "/analyticals" },
    { label: "Analytical Budget", to: "/budgets" },
    { label: "Chart of Account", to: "/accounts" },
    { label: "Journals", to: "/journals" },
    { label: "Journal Entries", to: "/journal-entries" },
  ],

  Report: [
    { label: "Balance Sheet", to: "/reports" },
    { label: "Profit and Loss", to: "/reports" },
    { label: "Budget Report", to: "/reports" },
  ],
};

type MetricBoxProps = {
  label: string;
  value: string | number;
  to: string;
};

const MetricBox = ({
  label,
  value,
  to,
}: MetricBoxProps) => (
  <Box
    component={RouterLink}
    to={to}
    sx={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2.5,
      px: 3,
      py: 1.7,
      minWidth: 120,
      textAlign: "left",
      bgcolor: "rgba(255,255,255,0.025)",
      transition: "all 0.2s ease",
      textDecoration: "none",
      cursor: "pointer",

      "&:hover": {
        borderColor: COLORS.accent,
        bgcolor: COLORS.cardHover,
        transform: "translateY(-2px)",
      },
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: COLORS.muted,
        fontSize: "0.78rem",
        fontWeight: 500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>

    <Typography
      variant="h6"
      sx={{
        color: COLORS.text,
        fontWeight: 700,
        fontSize: "1.2rem",
      }}
    >
      {value}
    </Typography>
  </Box>
);

type SectionContainerProps = {
  title: string;
  buttonLabel: string;
  buttonTo: string;
  metrics: {
    label: string;
    value: number | string;
    to: string;
  }[];
};

const SectionContainer = ({
  title,
  buttonLabel,
  buttonTo,
  metrics,
}: SectionContainerProps) => (
  <Box
    sx={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: 3,
      p: { xs: 2.5, md: 3 },
      mb: 2.5,
      bgcolor: COLORS.card,
      transition: "border-color 0.2s ease",

      "&:hover": {
        borderColor: COLORS.borderStrong,
      },
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      mb={2.5}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{
            color: COLORS.text,
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 28,
            height: 2,
            bgcolor: COLORS.accent,
            mt: 0.8,
            borderRadius: 2,
          }}
        />
      </Box>

      <Button
        component={RouterLink}
        to={buttonTo}
        variant="contained"
        sx={{
          bgcolor: COLORS.accent,
          color: "#071414",
          borderRadius: 2,
          px: 2.5,
          py: 0.8,
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.82rem",

          "&:hover": {
            bgcolor: COLORS.accentHover,
            boxShadow: "none",
          },
        }}
      >
        {buttonLabel}
      </Button>
    </Stack>

    <Stack
      direction="row"
      spacing={1.5}
      flexWrap="wrap"
      useFlexGap
    >
      {metrics.map((m) => (
        <MetricBox
          key={`${title}-${m.label}`}
          label={m.label}
          value={m.value}
          to={m.to}
        />
      ))}
    </Stack>
  </Box>
);

export const DashboardPage = () => {
  const [anchorEl, setAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const [activeMenu, setActiveMenu] =
    useState<keyof typeof menuData | null>(null);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    menu: keyof typeof menuData
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(menu);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const open = Boolean(anchorEl);

  const salesQuery = useQuery({
    queryKey: ["dash-sales-orders"],
    queryFn: () =>
      soApi.getSalesOrders({
        page: 1,
        pageSize: 50,
      }),
  });

  const purchaseQuery = useQuery({
    queryKey: ["dash-purchase-orders"],
    queryFn: () =>
      poApi.getPurchaseOrders({
        page: 1,
        pageSize: 50,
      }),
  });

  const budgetQuery = useQuery({
    queryKey: ["dash-budgets"],
    queryFn: () => budgetApi.getBudgets(),
  });

  const soList = salesQuery.data?.data ?? [];

  const soAll = soList.length;

  const soConfirmed = soList.filter(
    (s) => s.status === "CONFIRMED"
  ).length;

  const soDraft = soList.filter(
    (s) => s.status === "DRAFT"
  ).length;

  const poList = purchaseQuery.data?.data ?? [];

  const poAll = poList.length;

  const poConfirmed = poList.filter(
    (p) => p.status === "CONFIRMED"
  ).length;

  const poDraft = poList.filter(
    (p) => p.status === "DRAFT"
  ).length;

  const budgets = budgetQuery.data?.data ?? [];

  const budgetCount = budgets.length;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1100,
        mx: "auto",
        pt: 3,
        pb: 6,
        color: COLORS.text,
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            color: COLORS.text,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontSize: {
              xs: "1.7rem",
              md: "2rem",
            },
          }}
        >
          Dashboard
        </Typography>

        <Typography
          sx={{
            color: COLORS.muted,
            mt: 0.5,
            fontSize: "0.9rem",
          }}
        >
          Overview of your sales, purchases and financial activity
        </Typography>
      </Box>

      {/* Main Dashboard */}
      <Box
        sx={{
          width: "100%",
          borderRadius: 4,
          bgcolor: COLORS.page,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        {/* Top Navigation */}
        <Box
          sx={{
            borderBottom: `1px solid ${COLORS.border}`,
            px: {
              xs: 1,
              md: 3,
            },
            py: 1,
            bgcolor: "rgba(255,255,255,0.015)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="flex-start"
            spacing={1}
            sx={{
              overflowX: "auto",
            }}
          >
            {(
              Object.keys(menuData) as Array<
                keyof typeof menuData
              >
            ).map((key) => (
              <Button
                key={key}
                onClick={(e) =>
                  handleMenuClick(e, key)
                }
                sx={{
                  color:
                    activeMenu === key
                      ? COLORS.accent
                      : COLORS.muted,

                  textTransform: "none",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,

                  "&:hover": {
                    color: COLORS.text,
                    bgcolor:
                      "rgba(255,255,255,0.05)",
                  },
                }}
              >
                {key}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Menu Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#101A2B",
                border: `1px solid ${COLORS.borderStrong}`,
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.45)",
                borderRadius: 2.5,
                mt: 1,
                minWidth: 220,
                overflow: "hidden",
              },
            },
          }}
        >
          {activeMenu && (
            <Box
              sx={{
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.3,
              }}
            >
              <Typography
                sx={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  px: 1.5,
                  py: 1,
                  borderBottom: `1px solid ${COLORS.border}`,
                  mb: 0.5,
                }}
              >
                {activeMenu}
              </Typography>

              {menuData[activeMenu].map(
                (item, idx) => (
                  <Button
                    key={`${item.label}-${idx}`}
                    component={RouterLink}
                    to={item.to}
                    onClick={handleClose}
                    sx={{
                      color: COLORS.muted,
                      justifyContent: "flex-start",
                      textTransform: "none",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      py: 0.9,
                      px: 1.5,
                      borderRadius: 1.5,

                      "&:hover": {
                        color: COLORS.text,
                        bgcolor:
                          COLORS.accentSoft,
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                )
              )}
            </Box>
          )}
        </Popover>

        {/* Dashboard Sections */}
        <Box
          sx={{
            p: {
              xs: 2,
              md: 3.5,
            },
          }}
        >
          {/* Sales */}
          <SectionContainer
            title="Sales"
            buttonLabel="+ New Sales Order"
            buttonTo="/sales-orders/new"
            metrics={[
              {
                label: "All Orders",
                value: soAll || 12,
                to: "/sales-orders",
              },
              {
                label: "Confirmed",
                value: soConfirmed || 10,
                to: "/sales-orders?status=CONFIRMED",
              },
              {
                label: "Draft",
                value: soDraft || 2,
                to: "/sales-orders?status=DRAFT",
              },
            ]}
          />

          {/* Purchase */}
          <SectionContainer
            title="Purchase"
            buttonLabel="+ New Purchase Order"
            buttonTo="/purchase-orders/new"
            metrics={[
              {
                label: "All Orders",
                value: poAll || 12,
                to: "/purchase-orders",
              },
              {
                label: "Confirmed",
                value: poConfirmed || 10,
                to: "/purchase-orders?status=CONFIRMED",
              },
              {
                label: "Draft",
                value: poDraft || 2,
                to: "/purchase-orders?status=DRAFT",
              },
            ]}
          />

          {/* Budget */}
          <SectionContainer
            title="Budget Reports"
            buttonLabel="View Reports"
            buttonTo="/reports"
            metrics={[
              {
                label: "Active Budgets",
                value: budgetCount || 8,
                to: "/budgets",
              },
              {
                label: "Tracked Analytics",
                value: 5,
                to: "/analyticals",
              },
              {
                label: "Years Covered",
                value: "2025 & 2026",
                to: "/reports",
              },
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
};