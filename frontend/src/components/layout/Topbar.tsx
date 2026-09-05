import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { AppBar, Avatar, Box, Button, Toolbar, Typography } from "@mui/material";
import { drawerWidth } from "./AppSidebar";
import { useAuth } from "../../features/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
export const Topbar = () => { const { user, logout } = useAuth(); const navigate = useNavigate(); const signOut = async () => { await logout(); navigate("/login", { replace: true }); }; return <AppBar position="fixed" color="inherit" elevation={0} sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, borderBottom: 1, borderColor: "divider" }}><Toolbar><Typography variant="body2" color="text.secondary">Accounting workspace</Typography><Box sx={{ flexGrow: 1 }} /><Box sx={{ textAlign: "right", mr: 1 }}><Typography variant="body2" fontWeight={700}>{user?.name}</Typography><Typography variant="caption" color="text.secondary">{user?.role}</Typography></Box><Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", mr: 1 }}><AccountCircleOutlinedIcon /></Avatar><Button size="small" onClick={() => void signOut()}>Logout</Button></Toolbar></AppBar>; };
