import { useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AppBar, Avatar, Box, Button, Toolbar, Typography, Popover, Stack } from "@mui/material";
import { drawerWidth } from "./AppSidebar";
import { useAuth } from "../../features/auth/AuthProvider";
import { isSystemAdministrator } from "../../features/auth/roles";
import { useNavigate, Link as RouterLink } from "react-router-dom";

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

export const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<keyof typeof menuData | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, menu: keyof typeof menuData) => {
    if (activeMenu === menu && anchorEl) {
      setAnchorEl(null);
      setActiveMenu(null);
    } else {
      setAnchorEl(event.currentTarget);
      setActiveMenu(menu);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const open = Boolean(anchorEl);
  const visibleMenus = isSystemAdministrator(user?.role) ? menuData : { Report: menuData.Report };

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        color: "#0f172a"
      }}
    >
      <Toolbar>
        {/* Navigation Category Items */}
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          {(Object.keys(visibleMenus) as Array<keyof typeof menuData>).map((key) => (
            <Button
              key={key}
              size="small"
              onClick={(e) => handleMenuClick(e, key)}
              endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              sx={{
                color: activeMenu === key ? "#2563eb" : "#475569",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                px: 1.5,
                borderRadius: 1.5,
                "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" }
              }}
            >
              {key}
            </Button>
          ))}
        </Stack>

        {/* Popover for active menu category only */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                borderRadius: 3,
                mt: 1,
                minWidth: 200
              }
            }
          }}
        >
          {activeMenu && (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography color="#2563eb" fontWeight={700} fontSize="0.95rem" mb={1} sx={{ pb: 0.5, borderBottom: "1px solid #e2e8f0" }}>
                {activeMenu}
              </Typography>
              {visibleMenus[activeMenu as keyof typeof visibleMenus].map((item, idx) => (
                <Button
                  key={idx}
                  component={RouterLink}
                  to={item.to}
                  onClick={handleClose}
                  sx={{
                    color: "#334155",
                    justifyContent: "flex-start",
                    textTransform: "none",
                    fontSize: "0.88rem",
                    py: 0.7,
                    px: 1.5,
                    borderRadius: 1.5,
                    "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Popover>

        <Box sx={{ flexGrow: 1 }} />

        {isSystemAdministrator(user?.role) && (
          <Button
            size="small"
            variant="outlined"
            sx={{
              mr: 2,
              color: "#1e3a8a",
              borderColor: "#93c5fd",
              "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" }
            }}
            onClick={() => navigate("/users/new")}
          >
            + Create user
          </Button>
        )}

        <Box sx={{ textAlign: "right", mr: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600 }}>
            {user?.role}
          </Typography>
        </Box>

        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: "#2563eb",
            color: "white",
            border: "1px solid #bfdbfe",
            mr: 1.5
          }}
        >
          <AccountCircleOutlinedIcon />
        </Avatar>

        <Button
          size="small"
          variant="outlined"
          sx={{
            color: "#475569",
            borderColor: "#cbd5e1",
            "&:hover": { borderColor: "#2563eb", color: "#1e3a8a", bgcolor: "#eff6ff" }
          }}
          onClick={() => void signOut()}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};
