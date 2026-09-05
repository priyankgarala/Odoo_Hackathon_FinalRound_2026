import { Alert, Box, Button } from "@mui/material";
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => <Box sx={{ py: 3 }}><Alert severity="error" action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Retry</Button> : undefined}>{message}</Alert></Box>;
