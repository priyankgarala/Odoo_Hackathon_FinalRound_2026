import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme, type AppColorMode } from "../../theme";

type ColorModeContextValue = { mode: AppColorMode; toggleMode: () => void };
const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined);

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppColorMode>("light");
  const theme = useMemo(() => createAppTheme("light"), []);
  useEffect(() => {
    document.body.dataset.colorMode = "light";
    localStorage.setItem("urban_furniture_color_mode", "light");
  }, []);
  return (
    <ColorModeContext.Provider value={{ mode: "light", toggleMode: () => setMode("light") }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => {
  const value = useContext(ColorModeContext);
  if (!value) throw new Error("useColorMode must be used within ColorModeProvider");
  return value;
};
