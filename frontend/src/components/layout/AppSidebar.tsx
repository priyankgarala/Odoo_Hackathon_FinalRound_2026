import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import type { ReactNode } from "react";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { isSystemAdministrator } from "../../features/auth/roles";

export const drawerWidth = 260;

const administratorItems = [
  ["Contacts", "/contacts", <PeopleOutlineIcon fontSize="small" />],
  ["Products", "/products", <Inventory2OutlinedIcon fontSize="small" />],
  ["Tax Master", "/taxes", <PercentOutlinedIcon fontSize="small" />],
  ["Chart of Accounts", "/accounts", <AccountTreeOutlinedIcon fontSize="small" />],
  ["Journals", "/journals", <BookOutlinedIcon fontSize="small" />],
  ["Journal Entries", "/journal-entries", <ReceiptLongOutlinedIcon fontSize="small" />],
  ["Purchase Orders", "/purchase-orders", <ShoppingCartOutlinedIcon fontSize="small" />],
  ["Vendor Bills & Payments", "/vendor-bills", <RequestQuoteOutlinedIcon fontSize="small" />],
  ["Sales Orders", "/sales-orders", <PointOfSaleOutlinedIcon fontSize="small" />],
  ["Invoices & Payments", "/invoices", <PaymentsOutlinedIcon fontSize="small" />],
] as const;

export const AppSidebar = () => {
  const { user } = useAuth();
  const administrator = isSystemAdministrator(user?.role);
  const items = administrator ? administratorItems : [];

  return (
    <Box
      component="aside"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        bgcolor: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        color: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={900} letterSpacing={0.8} color="#0f172a">
            URBAN FURNITURE
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
            Accounting System
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#e2e8f0" }} />

      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        <NavItem to="/" label="Dashboard" icon={<DashboardOutlinedIcon fontSize="small" />} />
        <NavItem to="/reports" label="Reports" icon={<AssessmentOutlinedIcon fontSize="small" />} />
        
        {administrator && (
          <Typography variant="caption" sx={{ display: "block", px: 1.5, pt: 2, pb: 1, color: "#64748b", fontWeight: 700, letterSpacing: 1 }}>
            ADMINISTRATION
          </Typography>
        )}
        
        {items.map(([label, to, icon]) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}
      </List>

      <Box sx={{ p: 2, color: "#64748b", borderTop: "1px solid #e2e8f0" }}>
        <Typography variant="caption">{administrator ? "System Administrator" : "Viewer · read-only"}</Typography>
      </Box>
    </Box>
  );
};

const NavItem = ({ to, label, icon }: { to: string; label: string; icon: ReactNode }) => {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      end={to === "/"}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        color: "#475569",
        "&.active": {
          bgcolor: "#eff6ff",
          color: "#2563eb",
          fontWeight: 700,
          borderLeft: "3px solid #2563eb"
        },
        "&:hover": {
          bgcolor: "#f8fafc",
          color: "#0f172a"
        }
      }}
    >
      <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.9rem" }} />
    </ListItemButton>
  );
};
