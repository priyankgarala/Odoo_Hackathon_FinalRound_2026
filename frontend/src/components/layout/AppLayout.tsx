import { Box, CssBaseline, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import { AppSidebar, drawerWidth } from "./AppSidebar";
import { Topbar } from "./Topbar";
export const AppLayout = () => <Box sx={{ display: "flex", bgcolor: "background.default", minHeight: "100vh" }}><CssBaseline /><AppSidebar /><Topbar /><Box component="main" sx={{ width: `calc(100% - ${drawerWidth}px)`, flexGrow: 1, p: { xs: 2, md: 4 } }}><Toolbar /><Outlet /></Box></Box>;
