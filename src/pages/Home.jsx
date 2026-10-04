import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CircularProgress,
  Typography,
  Fab,
  Popover,
  TextField,
  Button, 
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { isAuthenticated, logOut } from "../services/authenticationService";
import Scene from "./Scene";
import Post from "../components/Post";
import {
  getFriendPosts,
  createPost,
  createPostWithMedia,
} from "../services/postService";
import { createPassword, getIdentityMyInfo } from "../services/userService";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const observer = useRef();
  const lastPostElementRef = useRef();
  const [anchorEl, setAnchorEl] = useState(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [userDetails, setUserDetails] = useState(null);
  const [showCreatePasswordDialog, setShowCreatePasswordDialog] =
    useState(false);
  const [onboardUsername, setOnboardUsername] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [creatingPassword, setCreatingPassword] = useState(false);

  const navigate = useNavigate();

  // Handle opening the popover
  const handleCreatePostClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the popover
  const handleClosePopover = () => {
    setAnchorEl(null);
    setNewPostContent("");
    setNewPostFile(null);
  };

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Handle posting new content
  const handlePostContent = () => {
    if (!newPostContent.trim() && !newPostFile) {
      return;
    }

    handleClosePopover();

    const createPostPromise = newPostFile
      ? createPostWithMedia(newPostContent, newPostFile)
      : createPost(newPostContent);

    createPostPromise
      .then((response) => {
        console.log("Post created successfully:", response.data);
        setPosts((prevPosts) => [response.data.result, ...prevPosts]);
        setNewPostContent("");
        setNewPostFile(null);
        setSnackbarMessage("Post created successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        setSnackbarMessage("Failed to create post. Please try again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };

  const handleSelectMedia = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setNewPostFile(file);
    event.target.value = "";
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? "post-popover" : undefined;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      loadPosts(page);
    }
  }, [navigate, page]);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    getIdentityMyInfo()
      .then((response) => {
        const info = response.data?.result;
        setUserDetails(info);

        if (info?.noPassword) {
          setOnboardUsername(info.username || "");
          setShowCreatePasswordDialog(true);
        }
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          logOut();
          navigate("/login");
        }
      });
  }, [navigate]);

  const handleCreatePassword = async () => {
    const normalizedUsername = onboardUsername.trim();

    if (!normalizedUsername || !onboardPassword) {
      setSnackbarMessage("Please enter username and password.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setCreatingPassword(true);
      await createPassword(normalizedUsername, onboardPassword);

      setUserDetails((prev) => ({
        ...prev,
        username: normalizedUsername,
        noPassword: false,
      }));
      setShowCreatePasswordDialog(false);
      setOnboardPassword("");
      setSnackbarMessage(
        "Your password has been created. You can use username/password to login."
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create password.";
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setCreatingPassword(false);
    }
  };

  const loadPosts = (page) => {
    console.log(`loading posts for page ${page}`);
    setLoading(true);
    getFriendPosts(page)
      .then((response) => {
        setTotalPages(response.data.result.totalPages);
        setPosts((prevPosts) => [...prevPosts, ...response.data.result.data]);
        setHasMore(response.data.result.data.length > 0);
        console.log("loaded posts:", response.data.result);
      })
      .catch((error) => {
        if (error.response.status === 401) {
          logOut();
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!hasMore) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (page < totalPages) {
          setPage((prevPage) => prevPage + 1);
        }
      }
    });
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }

    setHasMore(false);
  }, [hasMore]);

  return (
    <Scene>
      {" "}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ marginTop: "64px" }} // Position below the header
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Card
        sx={{
          minWidth: 500,
          maxWidth: 600,
          boxShadow: 3,
          borderRadius: 2,
          mt: "20px",
          padding: "20px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            gap: "10px",
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              mb: "10px",
            }}
          >
            Friends posts,
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%", // Ensure content takes full width
            }}
          ></Box>
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <Post ref={lastPostElementRef} key={post.id} post={post} />
              );
            } else {
              return <Post key={post.id} post={post} />;
            }
          })}
          {loading && (
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%" }}
            >
              <CircularProgress size="24px" />
            </Box>
          )}
        </Box>
      </Card>

      <Dialog
        open={showCreatePasswordDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create password for your account</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This account was created by Google login. Please set username and
            password to complete your account.
          </Typography>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={onboardUsername}
            onChange={(e) => setOnboardUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={onboardPassword}
            onChange={(e) => setOnboardPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleCreatePassword}
            disabled={creatingPassword}
          >
            {creatingPassword ? "Saving..." : "Create password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for creating new posts */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreatePostClick}
        sx={{
          position: "fixed",
          bottom: 30,
          right: 30,
        }}
      >
        <AddIcon />
      </Fab>
      {/* Popover for creating new post */}{" "}
      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 5,
              p: 3,
              width: 500,
            },
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create new Post
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="What's on your mind?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<ImageIcon />}
          >
            Add image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleSelectMedia}
            />
          </Button>
          {newPostFile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {newPostFile.name}
              </Typography>
              <IconButton size="small" onClick={() => setNewPostFile(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePostContent}
            disabled={!newPostContent.trim() && !newPostFile}
          >
            Post
          </Button>
        </Box>
      </Popover>
    </Scene>
  );
}
