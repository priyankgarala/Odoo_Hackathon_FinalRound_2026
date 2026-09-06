import { createTheme } from "@mui/material/styles";

export type AppColorMode = "light" | "dark";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      dark: "#1e40af",
      light: "#60a5fa",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f766e",
      light: "#14b8a6",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      disabled: "#94a3b8",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          scrollbarColor: "#cbd5e1 #f8fafc",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          backgroundImage: "none",
          borderColor: "#e2e8f0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#e2e8f0",
          color: "#0f172a",
        },
        head: {
          color: "#334155",
          fontWeight: 600,
          backgroundColor: "#f1f5f9",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: "#0f172a",
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#cbd5e1",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94a3b8",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
          },
        },
        input: {
          color: "#0f172a",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#475569",
          "&.Mui-focused": {
            color: "#2563eb",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export const createAppTheme = (mode: AppColorMode = "light") => {
  return createTheme({
    palette: {
      mode: "light",
      primary: { main: "#2563eb", dark: "#1e40af", light: "#60a5fa", contrastText: "#ffffff" },
      secondary: { main: "#0f766e", light: "#14b8a6", contrastText: "#ffffff" },
      background: { default: "#f8fafc", paper: "#ffffff" },
      text: { primary: "#0f172a", secondary: "#475569" },
      divider: "#e2e8f0"
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            scrollbarColor: "#cbd5e1 #f8fafc",
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundColor: "#ffffff", backgroundImage: "none", borderColor: "#e2e8f0" } } },
      MuiCard: { styleOverrides: { root: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", backgroundImage: "none" } } },
      MuiTableCell: { styleOverrides: { root: { borderColor: "#e2e8f0", color: "#0f172a" }, head: { color: "#334155", fontWeight: 600, backgroundColor: "#f1f5f9" } } },
      MuiOutlinedInput: { styleOverrides: { root: { color: "#0f172a", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" } }, input: { color: "#0f172a" } } },
      MuiInputLabel: { styleOverrides: { root: { color: "#475569", "&.Mui-focused": { color: "#2563eb" } } } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    },
  });
};
