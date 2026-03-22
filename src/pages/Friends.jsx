import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SendIcon from "@mui/icons-material/Send";
import Scene from "./Scene";
import {
  getMyFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
} from "../services/userService";
import { isAuthenticated, logOut } from "../services/authenticationService";

const FRIEND_FILTERS = {
  ALL: "ALL",
  SENT: "SENT",
  RECEIVED: "RECEIVED",
};

const FILTER_LABELS = {
  [FRIEND_FILTERS.ALL]: "All Friends",
  [FRIEND_FILTERS.SENT]: "Friend Request Sent",
  [FRIEND_FILTERS.RECEIVED]: "Friend Request Received",
};

const normalizeFriends = (payload) => {
  const result = payload?.data?.result;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FRIEND_FILTERS.ALL);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const menuOpen = Boolean(menuAnchorEl);

  const handleOpenFilterMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setMenuAnchorEl(null);
  };

  const loadFriends = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (activeFilter === FRIEND_FILTERS.SENT) {
        response = await getSentFriendRequests();
      } else if (activeFilter === FRIEND_FILTERS.RECEIVED) {
        response = await getReceivedFriendRequests();
      } else {
        response = await getMyFriends();
      }

      setFriends(normalizeFriends(response));
    } catch (err) {
      if (err.response?.status === 401) {
        logOut();
        navigate("/login");
        return;
      }

      console.error("Error loading friends:", err);
      setError("Failed to load friends list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (friend) => {
    const friendId = friend?.id || friend?.userId;
    if (!friendId) {
      return;
    }

    setActionLoadingId(friendId);
    try {
      await unfriend(friendId);
      await loadFriends();
    } catch (err) {
      console.error("Error unfriending:", err);
      setError("Failed to unfriend user. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (friend) => {
    if (!friend?.username) {
      return;
    }

    setActionLoadingId(friend.username);
    try {
      await sendFriendRequest(friend.username);
      await loadFriends();
    } catch (err) {
      console.error("Error accepting request:", err);
      setError("Failed to accept friend request. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendInvite = async () => {
    const username = inviteUsername.trim();
    if (!username) {
      return;
    }

    setSendingInvite(true);
    setError(null);

    try {
      await sendFriendRequest(username);
      setInviteUsername("");

      if (activeFilter === FRIEND_FILTERS.SENT) {
        await loadFriends();
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
      setError("Failed to send friend request. Please try again.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRejectRequest = async (friend) => {
    const friendId = friend?.id || friend?.userId;
    if (!friendId) {
      return;
    }

    setActionLoadingId(`reject-${friendId}`);
    try {
      await rejectFriendRequest(friendId);
      await loadFriends();
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject friend request. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    loadFriends();
  }, [activeFilter, navigate]);

  return (
    <Scene>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          pt: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 520,
            mb: 2,
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Enter username to add friend"
            value={inviteUsername}
            onChange={(event) => setInviteUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendInvite();
              }
            }}
          />
          <Tooltip title="Send friend request">
            <span>
              <IconButton
                color="primary"
                disabled={!inviteUsername.trim() || sendingInvite}
                onClick={handleSendInvite}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  width: 40,
                  height: 40,
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Card
          sx={{
            width: "100%",
            maxWidth: 520,
            boxShadow: 3,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={handleOpenFilterMenu}
              endIcon={<ArrowDropDownIcon />}
              sx={{ fontWeight: 700 }}
            >
              {FILTER_LABELS[activeFilter]}
            </Button>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleCloseFilterMenu}
            >
              <MenuItem
                selected={activeFilter === FRIEND_FILTERS.ALL}
                onClick={() => {
                  setActiveFilter(FRIEND_FILTERS.ALL);
                  handleCloseFilterMenu();
                }}
              >
                {FILTER_LABELS[FRIEND_FILTERS.ALL]}
              </MenuItem>
              <MenuItem
                selected={activeFilter === FRIEND_FILTERS.SENT}
                onClick={() => {
                  setActiveFilter(FRIEND_FILTERS.SENT);
                  handleCloseFilterMenu();
                }}
              >
                {FILTER_LABELS[FRIEND_FILTERS.SENT]}
              </MenuItem>
              <MenuItem
                selected={activeFilter === FRIEND_FILTERS.RECEIVED}
                onClick={() => {
                  setActiveFilter(FRIEND_FILTERS.RECEIVED);
                  handleCloseFilterMenu();
                }}
              >
                {FILTER_LABELS[FRIEND_FILTERS.RECEIVED]}
              </MenuItem>
            </Menu>
          </Box>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && friends.length === 0 && (
            <Typography color="text.secondary">
              {activeFilter === FRIEND_FILTERS.ALL &&
                "You do not have any friends yet."}
              {activeFilter === FRIEND_FILTERS.SENT &&
                "You have not sent any friend requests yet."}
              {activeFilter === FRIEND_FILTERS.RECEIVED &&
                "You have no received friend requests."}
            </Typography>
          )}

          {!loading && !error && friends.length > 0 && (
            <List>
              {friends.map((friend) => (
                <ListItem
                  key={friend.id || friend.userId || friend.username}
                  sx={{
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={friend.avatar || ""} alt={friend.username} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend.username || "Unknown user"}
                    secondary={`${friend.firstName || ""} ${friend.lastName || ""}`.trim()}
                    primaryTypographyProps={{
                      fontWeight: "medium",
                      variant: "body1",
                    }}
                  />
                  {activeFilter === FRIEND_FILTERS.ALL && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={actionLoadingId === (friend.id || friend.userId)}
                      onClick={() => handleUnfriend(friend)}
                    >
                      Unfriend
                    </Button>
                  )}
                  {activeFilter === FRIEND_FILTERS.RECEIVED && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={actionLoadingId === friend.username}
                        onClick={() => handleAcceptRequest(friend)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={
                          actionLoadingId === `reject-${friend.id || friend.userId}`
                        }
                        onClick={() => handleRejectRequest(friend)}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </Box>
    </Scene>
  );
}
