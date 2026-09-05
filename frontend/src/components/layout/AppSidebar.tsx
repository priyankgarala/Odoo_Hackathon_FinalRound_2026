import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

export const drawerWidth = 252;
export const AppSidebar = () => <Box component="aside" sx={{ width: drawerWidth, flexShrink: 0, bgcolor: "primary.dark", color: "primary.contrastText", minHeight: "100vh" }}><Toolbar><Typography variant="h6" fontWeight={800}>URBAN FURNITURE</Typography></Toolbar><Typography variant="overline" sx={{ px: 3, opacity: .65 }}>Workspace</Typography><List sx={{ px: 1 }}><ListItemButton component={NavLink} to="/" sx={{ borderRadius: 2, color: "inherit", "&.active": { bgcolor: "rgba(255,255,255,.14)" } }}><ListItemIcon sx={{ color: "inherit", minWidth: 38 }}><DashboardOutlinedIcon /></ListItemIcon><ListItemText primary="Dashboard" /></ListItemButton><ListItemButton component={NavLink} to="/contacts" sx={{ borderRadius: 2, color: "inherit", "&.active": { bgcolor: "rgba(255,255,255,.14)" } }}><ListItemIcon sx={{ color: "inherit", minWidth: 38 }}><PeopleOutlineIcon /></ListItemIcon><ListItemText primary="Contacts" /></ListItemButton></List></Box>;
