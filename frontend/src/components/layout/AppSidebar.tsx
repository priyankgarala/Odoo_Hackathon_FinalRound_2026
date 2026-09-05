import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from "@mui/material";
import { NavLink } from "react-router-dom";

export const drawerWidth = 260;

export const AppSidebar = () => (
  <Box
    component="aside"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      bgcolor: "#121212",
      borderRight: "1px solid rgba(255, 255, 255, 0.12)",
      color: "#ffffff",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}
  >
    <Toolbar sx={{ px: 3, py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "#3c3800",
            border: "1px solid #7a7300",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1rem",
            color: "#90EE90"
          }}
        >
          UF
        </Box>
        <Typography variant="subtitle1" fontWeight={800} letterSpacing={0.5} color="white">
          URBAN FURNITURE
        </Typography>
      </Box>
    </Toolbar>

    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 1 }} />

    <Typography variant="caption" sx={{ px: 3, py: 1, color: "rgba(255, 255, 255, 0.4)", fontWeight: 700, letterSpacing: 1 }}>
      WORKSPACE
    </Typography>

    <List sx={{ px: 1.5, flexGrow: 1 }}>
      <ListItemButton
        component={NavLink}
        to="/"
        end
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <DashboardOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/contacts"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <PeopleOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Contacts" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/products"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <Inventory2OutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Products" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/accounts"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <AccountTreeOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Chart of Accounts" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/taxes"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <PercentOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Tax Setup & Master" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/journals"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <BookOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Journals" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/journal-entries"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <ReceiptLongOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Journal Entries" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/purchase-orders"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <ShoppingCartOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Purchase Orders" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/vendor-bills"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <RequestQuoteOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Vendor Bills & Payments" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/sales-orders"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <PointOfSaleOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Sales Orders" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/invoices"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <PaymentsOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Invoices & Payments" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>

      <ListItemButton
        component={NavLink}
        to="/reports"
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: "rgba(255, 255, 255, 0.75)",
          "&.active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontWeight: 600,
            borderLeft: "3px solid #90EE90"
          },
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)", color: "#ffffff" }
        }}
      >
        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
          <AssessmentOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Financial Reports" primaryTypographyProps={{ fontSize: "0.9rem" }} />
      </ListItemButton>
    </List>
  </Box>
);
