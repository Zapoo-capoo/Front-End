import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Fab,
  IconButton,
  Popover,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import Scene from "./Scene";
import Post from "../components/Post";
import { isAuthenticated, logOut } from "../services/authenticationService";
import {
  createPost,
  createPostWithMedia,
  getMyPosts,
} from "../services/postService";

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const observer = useRef();
  const lastPostElementRef = useRef();

  const handleCreatePostClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setNewPostContent("");
    setNewPostFile(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

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
        setPosts((prevPosts) => [response.data.result, ...prevPosts]);
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

  const loadPosts = (pageNumber) => {
    setLoading(true);

    getMyPosts(pageNumber)
      .then((response) => {
        setTotalPages(response.data.result.totalPages);
        setPosts((prevPosts) => [...prevPosts, ...response.data.result.data]);
        setHasMore(response.data.result.data.length > 0);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          logOut();
          navigate("/login");
          return;
        }

        setSnackbarMessage("Failed to load your posts.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      loadPosts(page);
    }
  }, [navigate, page]);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < totalPages) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }

    setHasMore(false);
  }, [hasMore, page, totalPages]);

  const open = Boolean(anchorEl);

  return (
    <Scene>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ marginTop: "64px" }}
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
          <Typography sx={{ fontSize: 18, mb: "10px" }}>My posts,</Typography>

          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return <Post ref={lastPostElementRef} key={post.id} post={post} />;
            }

            return <Post key={post.id} post={post} />;
          })}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <CircularProgress size="24px" />
            </Box>
          )}
        </Box>
      </Card>

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

      <Popover
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
