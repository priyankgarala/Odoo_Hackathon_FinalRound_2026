import { useCallback, useEffect, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { getHealth, type HealthResponse } from "../api/health.api";
import { ErrorState } from "../components/feedback/ErrorState";
import { LoadingState } from "../components/feedback/LoadingState";

export const DashboardPage = () => {
  const [health, setHealth] = useState<HealthResponse>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(undefined); try { setHealth(await getHealth()); } catch { setError("The API or database is unavailable. Confirm both services are running and environment variables are configured."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <Stack spacing={3}><Box><Typography variant="h4" fontWeight={750}>Dashboard</Typography><Typography color="text.secondary">Urban Furniture Accounting System</Typography></Box><Alert severity="info">Business dashboards will be added in later phases. This page verifies the production connection foundation.</Alert>{loading ? <LoadingState label="Checking application connection..." /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : <Grid container spacing={3}><Grid size={{ xs: 12, md: 6 }}><Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography color="text.secondary">Express API</Typography><Typography variant="h5">Connected</Typography></Box><Chip icon={<CheckCircleOutlineIcon />} color="success" label={health?.api} /></Stack></CardContent></Card></Grid><Grid size={{ xs: 12, md: 6 }}><Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography color="text.secondary">PostgreSQL via Prisma</Typography><Typography variant="h5">Connected</Typography></Box><Chip icon={<CheckCircleOutlineIcon />} color="success" label={health?.database} /></Stack></CardContent></Card></Grid></Grid>}</Stack>;
};
