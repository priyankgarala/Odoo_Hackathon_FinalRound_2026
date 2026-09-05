import { useState, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography, Popover, Grid, Paper, Fade } from "@mui/material";

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
    { label: "Balancesheet", to: "/reports/balance-sheet" },
    { label: "Profit and Loss", to: "/reports/profit-and-loss" },
    { label: "Budget Report", to: "/reports/budget" },
  ],
};

const MetricBox = ({ label, value }: { label: string; value: string | number }) => (
  <Box
    sx={{
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: 4,
      px: 3,
      py: 1,
      minWidth: 100,
      textAlign: "center",
      "&:hover": { borderColor: "rgba(255,255,255,0.5)", bgcolor: "rgba(255,255,255,0.02)" }
    }}
  >
    <Typography variant="body2" color="rgba(255,255,255,0.7)">{label}</Typography>
    <Typography variant="h6" fontWeight={600} color="white">{value}</Typography>
  </Box>
);

const SectionContainer = ({ title, buttonLabel, buttonTo, metrics }: { title: string; buttonLabel: string; buttonTo: string; metrics: { label: string; value: number | string }[] }) => (
  <Box
    sx={{
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 4,
      p: 3,
      mb: 3,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h6" color="white" fontWeight={400}>{title}</Typography>
      <Button 
        component={RouterLink} 
        to={buttonTo} 
        variant="contained"
        sx={{
          bgcolor: "#2B5E74", // Blueish button from mockup
          color: "white",
          borderRadius: 2,
          px: 4,
          boxShadow: "none",
          textTransform: "none",
          "&:hover": { bgcolor: "#1f4759" }
        }}
      >
        {buttonLabel}
      </Button>
    </Stack>
    <Stack direction="row" spacing={3}>
      {metrics.map((m, i) => <MetricBox key={i} label={m.label} value={m.value} />)}
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

  return (
    <Stack spacing={3} alignItems="center" py={2}>
      {/* App Dashboard Label */}
      <Box sx={{ width: "100%", maxWidth: 800, textAlign: "center", mb: -1 }}>
        <Typography variant="h6" color="rgba(255,255,255,0.9)" fontWeight={400}>App Dashboard</Typography>
      </Box>

      {/* Main Dashboard Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 800,
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
        <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.15)", p: 2 }}>
          <Stack direction="row" justifyContent="space-around">
            {(Object.keys(menuData) as Array<keyof typeof menuData>).map((key) => (
              <Button
                key={key}
                onClick={(e) => handleMenuClick(e, key)}
                sx={{ 
                  color: activeMenu === key ? "white" : "rgba(255,255,255,0.7)", 
                  textTransform: "none", 
                  fontSize: "1.1rem",
                  fontWeight: 400
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#121212",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                borderRadius: 2,
                mt: 1,
                minWidth: 200
              }
            }
          }}
        >
          <Box sx={{ p: 2, display: 'flex', gap: 4 }}>
            {/* If clicking a specific tab, we could show all columns or just the active one. The mockup shows all columns in a huge dropdown. Let's just render the huge dropdown whenever ANY tab is clicked, to match the mockup's "Open on click" visual. */}
            {(Object.keys(menuData) as Array<keyof typeof menuData>).map((colKey) => (
              <Stack key={colKey} spacing={1} minWidth={120}>
                <Typography color="white" fontWeight={500} mb={1}>{colKey}</Typography>
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

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {/* Sales Section */}
          <SectionContainer
            title="Sales"
            buttonLabel="New"
            buttonTo="/sales-orders/new"
            metrics={[
              { label: "All", value: 12 },
              { label: "Confirmed", value: 10 },
              { label: "Draft", value: 2 },
            ]}
          />

          {/* Purchase Section */}
          <SectionContainer
            title="Purchase"
            buttonLabel="New"
            buttonTo="/purchase-orders/new"
            metrics={[
              { label: "All", value: 12 },
              { label: "Confirmed", value: 10 },
              { label: "Draft", value: 2 },
            ]}
          />

          {/* Budget Reports Section */}
          <SectionContainer
            title="Budget Reports"
            buttonLabel="Report"
            buttonTo="/reports/budget"
            metrics={[
              { label: "Achieved", value: 3 },
              { label: "Budget", value: 2 },
              { label: "Committed", value: 4 },
            ]}
          />
        </Box>
      </Box>
    </Stack>
  );
};
