import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export const AuthFrame = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      p: 2,
      bgcolor: "#121212",
      backgroundImage: "radial-gradient(circle at center, #1e3c38 0%, #121212 100%)",
      color: "white",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 460,
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      
      <Typography variant="h5" fontWeight={700} mb={3} color="white">
        {title}
      </Typography>
      {children}
    </Box>
  </Box>
);
