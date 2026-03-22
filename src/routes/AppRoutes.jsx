import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Chat from "../pages/Chat";
import Authenticate from "../pages/Authenticate";
import Register from "../pages/Register";
import Friends from "../pages/Friends";
import MyPosts from "../pages/MyPosts";

const authLightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

const AuthLightModeRoute = ({ children }) => {
  return (
    <ThemeProvider theme={authLightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLightModeRoute>
              <Login />
            </AuthLightModeRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLightModeRoute>
              <Register />
            </AuthLightModeRoute>
          }
        />
        <Route
          path="/authenticate"
          element={
            <AuthLightModeRoute>
              <Authenticate />
            </AuthLightModeRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:profileId" element={<Profile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
