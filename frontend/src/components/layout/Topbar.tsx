import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { AppBar, Avatar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { drawerWidth } from "./AppSidebar";
export const Topbar = () => <AppBar position="fixed" color="inherit" elevation={0} sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, borderBottom: 1, borderColor: "divider" }}><Toolbar><Typography variant="body2" color="text.secondary">Accounting workspace</Typography><Box sx={{ flexGrow: 1 }} /><IconButton aria-label="User profile"><Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}><AccountCircleOutlinedIcon /></Avatar></IconButton></Toolbar></AppBar>;
