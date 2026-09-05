import { Box, CircularProgress, Typography } from "@mui/material";
export const LoadingState = ({ label = "Loading..." }: { label?: string }) => <Box sx={{ display: "grid", placeItems: "center", gap: 2, minHeight: 180 }}><CircularProgress /><Typography color="text.secondary">{label}</Typography></Box>;
