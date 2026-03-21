import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authenticateWithGoogle } from "../services/authenticationService";
import { getIdentityMyInfo } from "../services/userService";

export default function Authenticate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");

  const handleCloseSnackBar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackBarOpen(false);
  };

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setSnackBarMessage("Google authentication code is missing.");
      setSnackBarOpen(true);
      navigate("/login", { replace: true });
      return;
    }

    const authenticate = async () => {
      try {
        await authenticateWithGoogle(code);
        await getIdentityMyInfo();
        navigate("/", { replace: true });
      } catch (error) {
        const message = error.response?.data?.message || "Google login failed.";
        setSnackBarMessage(message);
        setSnackBarOpen(true);
        navigate("/login", { replace: true });
      }
    };

    authenticate();
  }, [navigate, searchParams]);

  return (
    <>
      <Snackbar
        open={snackBarOpen}
        onClose={handleCloseSnackBar}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackBar}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackBarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "30px",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography>Authenticating with Google...</Typography>
      </Box>
    </>
  );
}
