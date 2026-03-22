import { createContext, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import AppRoutes from "./routes/AppRoutes";

export const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

const THEME_MODE_STORAGE_KEY = "zapoo-theme-mode";

function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return savedMode === "dark" ? "dark" : "light";
  });

  const colorModeContextValue = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
          return nextMode;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorModeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
