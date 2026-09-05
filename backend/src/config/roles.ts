export const ROLES = {
  SYSTEM_ADMINISTRATOR: "System Administrator",
  VIEWER: "Viewer",
} as const;

export const isSystemAdministrator = (role: string | undefined) => role === ROLES.SYSTEM_ADMINISTRATOR;
