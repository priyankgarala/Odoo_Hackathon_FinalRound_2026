import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export const AuthFrame = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      p: 2,
      bgcolor: "#f8fafc",
      backgroundImage: "radial-gradient(circle at center, #eff6ff 0%, #f8fafc 100%)",
      color: "#0f172a",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 460,
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      
      <Typography variant="h5" fontWeight={700} mb={1} color="#0f172a">
        {title}
      </Typography>
      <Typography variant="body2" mb={3} color="#64748b" textAlign="center">
        {subtitle}
      </Typography>
      {children}
    </Box>
  </Box>
);
