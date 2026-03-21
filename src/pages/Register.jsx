import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authenticationService";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackBarSeverity, setSnackBarSeverity] = useState("error");
  const [submitting, setSubmitting] = useState(false);

  const handleCloseSnackBar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackBarOpen(false);
  };

  const showMessage = (severity, message) => {
    setSnackBarSeverity(severity);
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  };

  const validate = () => {
    if (!email.trim()) {
      showMessage("error", "Email is required.");
      return false;
    }

    if (username.trim().length < 4) {
      showMessage("error", "Username must be at least 4 characters.");
      return false;
    }

    if (password.length < 6) {
      showMessage("error", "Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
      });

      showMessage("success", "Account created successfully. Please login.");
      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create account.";
      showMessage("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Snackbar
        open={snackBarOpen}
        onClose={handleCloseSnackBar}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackBar}
          severity={snackBarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackBarMessage}
        </Alert>
      </Snackbar>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="#f0f2f5"
      >
        <Card
          sx={{
            minWidth: 320,
            maxWidth: 460,
            boxShadow: 3,
            borderRadius: 3,
            padding: 2,
          }}
        >
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom>
              Create Account
            </Typography>

            <Box component="form" onSubmit={handleRegister}>
              <TextField
                label="First name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                label="Last name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                helperText="Minimum 4 characters"
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Minimum 6 characters"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                {submitting ? "Creating..." : "Create account"}
              </Button>

              <Button
                type="button"
                variant="text"
                size="large"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => navigate("/login")}
              >
                Back to login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
