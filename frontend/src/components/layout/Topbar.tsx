import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { AppBar, Avatar, Box, Button, Toolbar, Typography } from "@mui/material";
import { drawerWidth } from "./AppSidebar";
import { useAuth } from "../../features/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 500 }}>
          Accounting Workspace
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {user?.role === "Admin" && (
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
