import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  Box,
  Card,
  TextField,
  Typography,
  Paper,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
  ImageList,
  ImageListItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import Scene from "./Scene";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NewChatPopover from "../components/NewChatPopover";
import {
  getMyConversations,
  createConversation,
  createGroupConversation,
  getMessages,
  markConversationSeen,
  hasConversationSeen,
  createMessage,
  createMessageWithImage,
  deleteMessage,
} from "../services/chatService";
import { io } from "socket.io-client";
import { getToken, getCurrentUserId } from "../services/localStorageService";
import { getMyInfo } from "../services/userService";

const GROUP_AVATAR = `${process.env.PUBLIC_URL}/group-avatar.svg`;

// Every group shares the same icon; direct chats use the other user's avatar
const getConversationAvatar = (conversation) =>
  conversation?.type === "GROUP"
    ? GROUP_AVATAR
    : conversation?.conversationAvatar || "";

// hasSeen === false on my own participant entry means there is a message I have not opened yet
const isConversationUnseen = (conversation) =>
  conversation?.participants?.find((p) => p.userId === getCurrentUserId())
    ?.hasSeen === false;

const withMySeenState = (conversation, hasSeen) => ({
  ...conversation,
  participants: (conversation.participants || []).map((p) =>
    p.userId === getCurrentUserId() ? { ...p, hasSeen } : p
  ),
});

const resolveLatestIncomingAvatar = (messages, fallbackAvatar = "", currentUserId = null) => {
  const latestIncomingMessageWithAvatar = [...messages]
    .reverse()
    .find((msg) => msg?.sender?.userId !== currentUserId && msg?.sender?.avatar);

  return latestIncomingMessageWithAvatar?.sender?.avatar || fallbackAvatar;
};

const isMessageFromCurrentUser = (message) => {
  const currentUserId = getCurrentUserId();
  return message?.sender?.userId === currentUserId;
};

export default function Chat() {
  const theme = useTheme();
  const [message, setMessage] = useState("");
  const [newChatAnchorEl, setNewChatAnchorEl] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [myAvatar, setMyAvatar] = useState("");
  // On small screens only one pane (list or chat) is visible at a time
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [cursorMap, setCursorMap] = useState({});
  const [hasMoreMap, setHasMoreMap] = useState({});
  const [loadingOldMessagesMap, setLoadingOldMessagesMap] = useState({});
  const fileInputRef = useRef(null);
  const messageContainerRef = useRef(null);
  const firstMessageRef = useRef(null);
  const observerRef = useRef(null);
  const prependAnchorRef = useRef(null);
  const prevMessageEdgesRef = useRef({ first: null, last: null });
  const socketRef = useRef(null); // Function to scroll to the bottom of the message container
  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      // Immediate scroll attempt
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;

      // Backup attempt with a small timeout to ensure DOM updates are complete
      setTimeout(() => {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }, 100);

      // Final attempt with a longer timeout
      setTimeout(() => {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }, 300);
    }
  }, []);

  // New chat popover handlers
  const handleNewChatClick = (event) => {
    setNewChatAnchorEl(event.currentTarget);
  };

  const handleCloseNewChat = () => {
    setNewChatAnchorEl(null);
  };

  const handleCreateGroup = async (name, users) => {
    const response = await createGroupConversation({
      name,
      participantIds: users.map((u) => u.userId),
    });
    const newGroup = response?.data?.result;
    if (!newGroup) return;
    setConversations((prev) => [
      newGroup,
      ...prev.filter((c) => c.id !== newGroup.id),
    ]);
    setSelectedConversation(newGroup);
    setMobileChatOpen(true);
  };

  const handleSelectNewChatUser = async (user) => {
    const response = await createConversation({
      type: "DIRECT",
      participantIds: [user.userId],
    });

    const newConversation = response?.data?.result;

    // Check if we already have a conversation with this user
    const existingConversation = conversations.find(
      (conv) => conv.id === newConversation.id
    );

    if (existingConversation) {
      // If conversation exists, just select it
      setSelectedConversation(existingConversation);
      setMobileChatOpen(true);
    } else {
      const normalizedConversation = {
        ...newConversation,
        conversationAvatar:
          newConversation?.conversationAvatar || user?.avatar || "",
      };

      // Add to conversations list
      setConversations((prevConversations) => [
        normalizedConversation,
        ...prevConversations,
      ]);

      // Select this new conversation
      setSelectedConversation(normalizedConversation);
      setMobileChatOpen(true);
    }
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyConversations();
      setConversations(response?.data?.result || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load my own profile to show my avatar next to my messages
  useEffect(() => {
    getMyInfo()
      .then((res) => setMyAvatar(res?.data?.result?.avatar || ""))
      .catch((err) => console.error("Error loading my profile:", err));
  }, []);

  // Load messages from the conversation history when a conversation is selected
  useEffect(() => {
    const fetchMessages = async (conversationId, pageNum = 1) => {
      try {
        // Check if we already have messages for this conversation
        if (pageNum === 1 && !messagesMap[conversationId]) {
          const response = await getMessages(conversationId, null, 20);
          if (response?.data?.result) {
            const messageData = response.data.result;
            
            // Sort messages by createdDate to ensure chronological order
            const sortedMessages = [...messageData.data].sort(
              (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
            );

            // Initialize cursor pagination state
            setHasMoreMap((prev) => ({
              ...prev,
              [conversationId]: !!messageData.hasMore,
            }));

            setCursorMap((prev) => ({
              ...prev,
              [conversationId]: messageData.nextCursor || null,
            }));

            // Update messages map with the fetched messages
            setMessagesMap((prev) => ({
              ...prev,
              [conversationId]: sortedMessages,
            }));
          }
        }

        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unread: 0 } : conv
          )
        );
      } catch (err) {
        console.error(
          `Error fetching messages for conversation ${conversationId}:`,
          err
        );
      }
    };

    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, messagesMap]);
  const currentMessages = selectedConversation
    ? messagesMap[selectedConversation.id] || []
    : [];



  // Keep the viewport where it is when older messages are prepended,
  // otherwise scroll to the bottom only when a newer message arrives
  useLayoutEffect(() => {
    const container = messageContainerRef.current;
    const first = currentMessages[0]?.id;
    const last = currentMessages[currentMessages.length - 1]?.id;
    const prev = prevMessageEdgesRef.current;

    if (container && prependAnchorRef.current && first !== prev.first) {
      const { height, top } = prependAnchorRef.current;
      container.scrollTop = top + (container.scrollHeight - height);
      prependAnchorRef.current = null;
    } else if (last !== prev.last) {
      scrollToBottom();
    }

    prevMessageEdgesRef.current = { first, last };
  }, [currentMessages, scrollToBottom]);

  // Also scroll when the conversation changes
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, scrollToBottom]);

  useEffect(() => {
    // Initialize socket connection only once
    if (!socketRef.current) {
      console.log("Initializing socket connection...");

      const connectionUrl = "http://localhost:8099?token=" + getToken();

      socketRef.current = new io(connectionUrl);

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("message", (message) => {
        console.log("New message received:", message);

        const messageObject = JSON.parse(message);
        console.log("Parsed message object:", messageObject);

        // Update messages in the UI when a new message is received
        if (messageObject?.conversationId) {
          handleIncomingMessage(messageObject);
        }
      });

      socketRef.current.on("message:delete", (deleteEvent) => {
        console.log("Message delete event received:", deleteEvent);

        const deleteObject = JSON.parse(deleteEvent);
        const { messageId, conversationId } = deleteObject;

        // Remove deleted message from the UI
        if (conversationId) {
          setMessagesMap((prev) => {
            const updatedMessages = (prev[conversationId] || []).filter(
              (msg) => msg.id !== messageId
            );
            return {
              ...prev,
              [conversationId]: updatedMessages,
            };
          });
        }
      });
    }

    // Cleanup function - disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Update unread count when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && socketRef.current) {
      // Mark the currently selected conversation as read
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, unread: 0 } : conv
        )
      );
    }
  }, [selectedConversation]);

  // IntersectionObserver for scroll-up pagination
  useEffect(() => {
    const conversationId = selectedConversation?.id;
    if (!conversationId) {
      return;
    }

    const hasMore = hasMoreMap[conversationId] || false;
    const isLoading = loadingOldMessagesMap[conversationId] || false;

    // Don't set up observer if already loading, no more pages, or no conversation selected
    if (isLoading || !hasMore) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let observerInstance = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Check again to avoid double-loading
          const convId = selectedConversation.id;
          const convHasMore = hasMoreMap[convId] || false;
          const convCursor = cursorMap[convId] || null;
          const isAlreadyLoading = loadingOldMessagesMap[convId] || false;

          if (!isAlreadyLoading && convHasMore && convCursor) {
            // Capture scroll height BEFORE loading
            const scrollContainer = messageContainerRef.current;
            if (scrollContainer) {
              prependAnchorRef.current = {
                height: scrollContainer.scrollHeight,
                top: scrollContainer.scrollTop,
              };
            }

            // Mark as loading BEFORE making the request
            setLoadingOldMessagesMap((prev) => ({
              ...prev,
              [convId]: true,
            }));

            getMessages(convId, convCursor, 20)
              .then((response) => {
                if (response?.data?.result?.data?.length > 0) {
                  const newMessages = response.data.result.data.sort(
                    (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
                  );

                  // Prepend new messages (older messages go to the top)
                  setMessagesMap((prev) => ({
                    ...prev,
                    [convId]: [
                      ...newMessages,
                      ...(prev[convId] || []),
                    ],
                  }));

                }

                const result = response?.data?.result;
                setHasMoreMap((prev) => ({
                  ...prev,
                  [convId]: !!result?.hasMore,
                }));
                setCursorMap((prev) => ({
                  ...prev,
                  [convId]: result?.nextCursor || null,
                }));
              })
              .catch((error) => {
                console.error("Error loading older messages:", error);
              })
              .finally(() => {
                // Mark as done loading
                setLoadingOldMessagesMap((prev) => ({
                  ...prev,
                  [convId]: false,
                }));
              });
          }
        }
      },
      {
        root: messageContainerRef.current,
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observerRef.current = observerInstance;

    if (firstMessageRef.current) {
      observerInstance.observe(firstMessageRef.current);
    }

    return () => {
      if (observerInstance) {
        observerInstance.disconnect();
      }
    };
  }, [selectedConversation?.id, cursorMap, hasMoreMap, loadingOldMessagesMap, selectedConversation]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setMobileChatOpen(true);

    // Ask the backend whether it is already seen; only mark it when it is not
    hasConversationSeen(conversation.id)
      .then((res) => {
        if (res?.data?.result === false) {
          return markConversationSeen(conversation.id).then(() =>
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversation.id ? withMySeenState(c, true) : c
              )
            )
          );
        }
      })
      .catch((err) => console.error("Error checking seen state:", err));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid image file");
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!selectedConversation) return;

    // Store values before clearing
    const messageText = message;
    const file = selectedFile;

    // Clear input fields
    setMessage("");
    handleClearImage();

    try {
      // Send message to API
      if (file) {
        const response = await createMessageWithImage({
          conversationId: selectedConversation.id,
          message: messageText,
          file: file,
        });
      } else {
        const response = await createMessage({
          conversationId: selectedConversation.id,
          message: messageText,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Message context menu handlers
  const handleMessageContextMenu = (event, messageId) => {
    event.preventDefault();
    setMessageContextMenu(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleCloseMessageContextMenu = () => {
    setMessageContextMenu(null);
    setSelectedMessageId(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return;

    try {
      // Call API to delete message
      await deleteMessage(selectedMessageId);

      // Remove message from UI
      setMessagesMap((prev) => {
        if (selectedConversation) {
          const updatedMessages = prev[selectedConversation.id].filter(
            (msg) => msg.id !== selectedMessageId
          );
          return {
            ...prev,
            [selectedConversation.id]: updatedMessages,
          };
        }
        return prev;
      });

      // Close context menu
      handleCloseMessageContextMenu();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  // Helper function to handle incoming socket messages
  const handleIncomingMessage = useCallback(
    (message) => {
  
      // Add the new message to the appropriate conversation
      setMessagesMap((prev) => {
        const existingMessages = prev[message.conversationId] || [];

        // Check if message already exists to avoid duplicates
        const messageExists = existingMessages.some((msg) => {
          // Primary: Compare by ID if both messages have IDs
          if (msg.id && message.id) {
            return msg.id === message.id;
          }
          
          return false;
        });

        if (!messageExists) {
          const updatedMessages = [...existingMessages, message].sort(
            (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
          );

          return {
            ...prev,
            [message.conversationId]: updatedMessages,
          };
        }

        console.log("Message already exists, not adding");
        return prev;
      });

      // Update the conversation list with the new last message
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.id !== message.conversationId) {
            return conv;
          }

          const nextConversationAvatar =
            !isMessageFromCurrentUser(message) && message?.sender?.avatar
              ? message.sender.avatar
              : conv.conversationAvatar;

          const fromOther = !isMessageFromCurrentUser(message);
          const isOpen = selectedConversation?.id === message.conversationId;
          let seenState = conv;
          if (fromOther) {
            if (isOpen) {
              // The user is looking at this conversation, so it counts as seen
              markConversationSeen(conv.id).catch(() => {});
            } else {
              seenState = withMySeenState(conv, false);
            }
          }

          const updatedConversation = {
            ...seenState,
            lastTimestamp: new Date(message.createdDate).toLocaleString(),
            unread:
              selectedConversation?.id === message.conversationId
                ? 0
                : (conv.unread || 0) + 1,
            modifiedDate: message.createdDate,
            conversationAvatar: nextConversationAvatar,
          };

          if (selectedConversation?.id === message.conversationId) {
            setSelectedConversation(updatedConversation);
          }

          return updatedConversation;
        });

        return updatedConversations;
      });
    },
    [selectedConversation]
  );

  return (
    <Scene>
      <Card
        sx={{
          width: "100%",
          height: {
            xs: "calc(100dvh - 56px)",
            sm: "calc(100dvh - 64px)",
          } /* viewport minus app bar */,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "row",
          mb: { xs: "-56px", sm: "-64px" } /* Counteract the toolbar spacer */,
          overflow: "hidden",
        }}
      >
        {/* Conversations List */}
        <Box
          sx={{
            width: { xs: "100%", md: 300 },
            flexShrink: 0,
            borderRight: 1,
            borderColor: "divider",
            display: { xs: mobileChatOpen ? "none" : "flex", md: "flex" },
            flexDirection: "column",
          }}
        >
          {" "}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Chats</Typography>{" "}
            <IconButton
              color="primary"
              size="small"
              onClick={handleNewChatClick}
              sx={{
                bgcolor: "primary.light",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.main",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>{" "}
            <NewChatPopover
              anchorEl={newChatAnchorEl}
              open={Boolean(newChatAnchorEl)}
              onClose={handleCloseNewChat}
              onSelectUser={handleSelectNewChatUser}
              onCreateGroup={handleCreateGroup}
            />
          </Box>{" "}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {(() => {
              if (loading) {
                return (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={28} />
                  </Box>
                );
              }
              if (error) {
                return (
                  <Box sx={{ p: 2 }}>
                    <Alert
                      severity="error"
                      sx={{ mb: 2 }}
                      action={
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={fetchConversations}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {error}
                    </Alert>
                  </Box>
                );
              }
              if (conversations == null || conversations.length === 0) {
                return (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      No conversations yet. Start a new chat to begin.
                    </Typography>
                  </Box>
                );
              }
              return (
                <List sx={{ width: "100%" }}>
                  {conversations.map((conversation) => (
                    <React.Fragment key={conversation.id}>
                      {" "}
                      <ListItem
                        alignItems="flex-start"
                        onClick={() => handleConversationSelect(conversation)}
                        sx={{
                          cursor: "pointer",
                          bgcolor:
                            selectedConversation?.id === conversation.id
                              ? "rgba(0, 0, 0, 0.04)"
                              : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.08)",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            badgeContent={conversation.unread}
                            invisible={conversation.unread === 0}
                            overlap="circular"
                          >
                            <Avatar
                              src={getConversationAvatar(conversation)}
                            />
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              display={"flex"}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                noWrap
                                sx={{
                                  display: "inline",
                                  fontWeight: isConversationUnseen(conversation)
                                    ? 700
                                    : 400,
                                }}
                              >
                                {conversation.conversationName}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: "inline", fontSize: "0.7rem" }}
                              >
                                {new Date(
                                  conversation.modifiedDate
                                ).toLocaleString("vi-VN", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                })}
                              </Typography>
                            </Stack>
                          }
                          primaryTypographyProps={{
                            fontWeight:
                              isConversationUnseen(conversation) ? "bold" : "normal",
                          }}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pr: 1,
                          }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              );
            })()}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: { xs: mobileChatOpen ? "flex" : "none", md: "flex" },
            flexDirection: "column",
          }}
        >
          {selectedConversation ? (
            <>
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={() => setMobileChatOpen(false)}
                  sx={{ display: { xs: "inline-flex", md: "none" }, mr: 1 }}
                  aria-label="back to conversations"
                >
                  <ArrowBackIcon />
                </IconButton>
                <Avatar
                  src={getConversationAvatar(selectedConversation)}
                  sx={{ mr: 2 }}
                />
                <Typography variant="h6" noWrap>
                  {selectedConversation.conversationName}
                </Typography>
              </Box>{" "}
              <Box
                id="messageContainer"
                ref={messageContainerRef}
                sx={{
                  flexGrow: 1,
                  p: 2,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {" "}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    margin:
                      "auto 0 0 0" /* Push to bottom, but allow scrolling */,
                  }}
                >
                  {loadingOldMessagesMap[selectedConversation?.id] && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <CircularProgress size={32} />
                    </Box>
                  )}
                  {currentMessages.map((msg, index) => {
                    const isDarkMode = theme.palette.mode === "dark";

                    // Dark mode: sender bubble dark blue, receiver bubble gray.
                    const senderBackgroundColor = isDarkMode
                      ? "#0d47a1"
                      : msg.failed
                      ? "#ffebee"
                      : "#e3f2fd";

                    const receiverBackgroundColor = isDarkMode
                      ? "#424242"
                      : "#f5f5f5";

                    const backgroundColor = isMessageFromCurrentUser(msg)
                      ? senderBackgroundColor
                      : receiverBackgroundColor;

                    const messageTextColor = isDarkMode ? "#ffffff" : "inherit";

                    return (
                      <Box
                        key={msg.id}
                        ref={index === 0 ? firstMessageRef : null}
                        sx={{
                          display: "flex",
                          justifyContent: isMessageFromCurrentUser(msg) ? "flex-end" : "flex-start",
                          mb: 2,
                        }}
                      >
                        {!isMessageFromCurrentUser(msg) && (
                          <Avatar
                            src={msg.sender?.avatar}
                            sx={{
                              mr: 1,
                              alignSelf: "flex-end",
                              width: 32,
                              height: 32,
                            }}
                          />
                        )}
                        <Paper
                          elevation={1}
                          onClick={(e) => {
                            if (isMessageFromCurrentUser(msg)) {
                              handleMessageContextMenu(e, msg.id);
                            }
                          }}
                          sx={{
                            p: { xs: 1.25, sm: 2 },
                            maxWidth: { xs: "80%", md: "70%" },
                            minWidth: 0,
                            wordBreak: "break-word",
                            backgroundColor,
                            color: messageTextColor,
                            borderRadius: 2,
                            opacity: msg.pending ? 0.7 : 1,
                            cursor: isMessageFromCurrentUser(msg) ? "pointer" : "default",
                          }}
                        >
                          {msg.imgUrl && (
                            <Box
                              component="img"
                              src={msg.imgUrl}
                              alt="Message image"
                              sx={{
                                maxWidth: "100%",
                                maxHeight: 300,
                                borderRadius: 1,
                                mb: msg.message ? 1 : 0,
                              }}
                            />
                          )}
                          {msg.message && (
                            <Typography variant="body1">{msg.message}</Typography>
                          )}
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="flex-end"
                            sx={{ mt: 1 }}
                          >
                            {msg.failed && (
                              <Typography variant="caption" color="error">
                                Failed to send
                              </Typography>
                            )}
                            {msg.pending && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Sending...
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{ display: "block", textAlign: "right" }}
                            >
                              {new Date(msg.createdDate).toLocaleString()}
                            </Typography>
                          </Stack>{" "}
                        </Paper>
                        {isMessageFromCurrentUser(msg) && (
                          <Avatar
                            sx={{
                              ml: 1,
                              alignSelf: "flex-end",
                              width: 32,
                              height: 32,
                              bgcolor: "#1976d2",
                            }}
                            src={myAvatar || msg?.sender?.avatar || ""}
                          >
                            You
                          </Avatar>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {previewImage && (
                  <Box
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      width: "fit-content",
                    }}
                  >
                    <Box
                      component="img"
                      src={previewImage}
                      alt="Preview"
                      sx={{
                        maxWidth: 150,
                        maxHeight: 150,
                        borderRadius: 1,
                        border: "2px solid #1976d2",
                      }}
                    />
                    <Tooltip title="Remove image">
                      <IconButton
                        size="small"
                        onClick={handleClearImage}
                        sx={{
                          position: "absolute",
                          top: -12,
                          right: -12,
                          bgcolor: "white",
                          border: "1px solid #ddd",
                          "&:hover": {
                            bgcolor: "#f5f5f5",
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                <Box
                  component="form"
                  sx={{
                    display: "flex",
                    gap: 1,
                  }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <Tooltip title="Attach image">
                    <IconButton
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                      size="small"
                    >
                      <ImageIcon />
                    </IconButton>
                  </Tooltip>
                  <TextField
                    fullWidth
                    placeholder="Type a message"
                    variant="outlined"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    size="small"
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!message.trim() && !selectedFile}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>

        {/* Message Context Menu */}
        <Menu
          anchorEl={messageContextMenu}
          open={Boolean(messageContextMenu)}
          onClose={handleCloseMessageContextMenu}
        >
          <MenuItem onClick={handleDeleteMessage}>
            <DeleteIcon sx={{ mr: 1, fontSize: "small" }} />
            Delete Message
          </MenuItem>
        </Menu>
      </Card>
    </Scene>
  );
}
