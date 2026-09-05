import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Box, Typography } from "@mui/material";
export const EmptyState = ({ message = "Nothing to show yet." }: { message?: string }) => <Box sx={{ display: "grid", placeItems: "center", minHeight: 180, color: "text.secondary" }}><InboxOutlinedIcon fontSize="large" /><Typography>{message}</Typography></Box>;
