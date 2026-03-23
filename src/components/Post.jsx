import { Box, Avatar, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import React, { forwardRef, useState } from 'react';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";

const Post = forwardRef((props, ref) => {
  const { avatar, username, created, content, mediaUrl } = props.post;
  const { isOwnPost, onDelete } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(props.post.id);
    }
  };
  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "start",
          marginBottom: 2,
          flex: 1,
        }}
      >
        <Avatar src={avatar} sx={{ marginRight: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {username}
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 400,
              }}
            >
              {created}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 14,
            }}
          >
            {content}
          </Typography>
          {mediaUrl && (
            <Box
              component="img"
              src={mediaUrl}
              alt="Post media"
              sx={{
                mt: 1,
                width: "100%",
                maxWidth: 420,
                maxHeight: 420,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          )}
        </Box>
      </Box>
      
      {isOwnPost && (
        <Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleDeleteClick}>
              <DeleteIcon sx={{ mr: 1, fontSize: "small" }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      )}
    </Box>
  );
});

export default Post;
