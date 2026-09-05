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
import type { ReactNode } from "react";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { isSystemAdministrator } from "../../features/auth/roles";

export const drawerWidth = 260;
const administratorItems = [
  ["Contacts", "/contacts", <PeopleOutlineIcon fontSize="small" />], ["Products", "/products", <Inventory2OutlinedIcon fontSize="small" />],
  ["Chart of Accounts", "/accounts", <AccountTreeOutlinedIcon fontSize="small" />], ["Journals", "/journals", <BookOutlinedIcon fontSize="small" />],
  ["Journal Entries", "/journal-entries", <ReceiptLongOutlinedIcon fontSize="small" />], ["Purchase Orders", "/purchase-orders", <ShoppingCartOutlinedIcon fontSize="small" />],
  ["Vendor Bills & Payments", "/vendor-bills", <RequestQuoteOutlinedIcon fontSize="small" />], ["Sales Orders", "/sales-orders", <PointOfSaleOutlinedIcon fontSize="small" />],
  ["Invoices & Payments", "/invoices", <PaymentsOutlinedIcon fontSize="small" />],
] as const;

export const AppSidebar = () => {
  const { user } = useAuth(); const administrator = isSystemAdministrator(user?.role);
  const items = administrator ? administratorItems : [];
  return <Box component="aside" sx={{ width: drawerWidth, flexShrink: 0, bgcolor: "#101827", borderRight: "1px solid #263550", color: "#e8efff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <Toolbar sx={{ px: 3, py: 2 }}><Box><Typography variant="subtitle1" fontWeight={900} letterSpacing={.8}>URBAN FURNITURE</Typography><Typography variant="caption" sx={{ color: "#9cb2d8" }}>Accounting System</Typography></Box></Toolbar><Divider sx={{ borderColor: "#263550" }} />
    <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
      <NavItem to="/" label="Dashboard" icon={<DashboardOutlinedIcon fontSize="small" />} />
      <NavItem to="/reports" label="Reports" icon={<AssessmentOutlinedIcon fontSize="small" />} />
      {administrator && <Typography variant="caption" sx={{ display: "block", px: 1.5, pt: 2, pb: 1, color: "#7f94b8", fontWeight: 700, letterSpacing: 1 }}>ADMINISTRATION</Typography>}
      {items.map(([label, to, icon]) => <NavItem key={to} to={to} label={label} icon={icon} />)}
    </List>
    <Box sx={{ p: 2, color: "#7f94b8" }}><Typography variant="caption">{administrator ? "System Administrator" : "Viewer · read-only"}</Typography></Box>
  </Box>;
};

const NavItem = ({ to, label, icon }: { to: string; label: string; icon: ReactNode }) => <ListItemButton component={NavLink} to={to} end={to === "/"} sx={{ borderRadius: 2, mb: .5, color: "#b8c8e5", "&.active": { bgcolor: "#213456", color: "#fff", borderLeft: "3px solid #38bdf8" }, "&:hover": { bgcolor: "#182642", color: "#fff" } }}><ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{icon}</ListItemIcon><ListItemText primary={label} primaryTypographyProps={{ fontSize: ".9rem" }} /></ListItemButton>;
