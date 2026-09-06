import { Box, CssBaseline, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import { AppSidebar, drawerWidth } from "./AppSidebar";
import { Topbar } from "./Topbar";
export const AppLayout = () => <Box className="app-wireframe" sx={{ display: "flex", bgcolor: "background.default", minHeight: "100vh" }}><CssBaseline /><AppSidebar /><Topbar /><Box component="main" sx={{ width: `calc(100% - ${drawerWidth}px)`, flexGrow: 1, px: { xs: 2, md: 5 }, pb: { xs: 3, md: 5 }, pt: { xs: 2, md: 3 } }}><Toolbar sx={{ minHeight: { xs: 56, md: 64 } }} /><Box sx={{ maxWidth: 1440, mx: "auto" }}><Outlet /></Box></Box></Box>;
