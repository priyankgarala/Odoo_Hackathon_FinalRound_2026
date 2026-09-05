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
        bgcolor: "#121212",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        color: "#ffffff"
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
                color: activeMenu === key ? "#90EE90" : "rgba(255, 255, 255, 0.8)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                px: 1.5,
                borderRadius: 1.5,
                "&:hover": { color: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.08)" }
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
                bgcolor: "#121212",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
                borderRadius: 3,
                mt: 1,
                minWidth: 200
              }
            }
          }}
        >
          {activeMenu && (
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography color="#90EE90" fontWeight={700} fontSize="0.95rem" mb={1} sx={{ pb: 0.5, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                {activeMenu}
              </Typography>
              {visibleMenus[activeMenu as keyof typeof visibleMenus].map((item, idx) => (
                <Button
                  key={idx}
                  component={RouterLink}
                  to={item.to}
                  onClick={handleClose}
                  sx={{
                    color: "rgba(255,255,255,0.85)",
                    justifyContent: "flex-start",
                    textTransform: "none",
                    fontSize: "0.88rem",
                    py: 0.7,
                    px: 1.5,
                    borderRadius: 1.5,
                    "&:hover": { color: "#90EE90", bgcolor: "rgba(255,255,255,0.08)" }
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
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.3)",
              "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" }
            }}
            onClick={() => navigate("/users/new")}
          >
            + Create user
          </Button>
        )}

        <Box sx={{ textAlign: "right", mr: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="white">
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#90EE90" }}>
            {user?.role}
          </Typography>
        </Box>

        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: "#2B5E74",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            mr: 1.5
          }}
        >
          <AccountCircleOutlinedIcon />
        </Avatar>

        <Button
          size="small"
          variant="outlined"
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            "&:hover": { borderColor: "white", color: "white", bgcolor: "rgba(255,255,255,0.08)" }
          }}
          onClick={() => void signOut()}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};
