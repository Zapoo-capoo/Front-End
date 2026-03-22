import { Box, Avatar, Typography } from "@mui/material";
import React, { forwardRef } from 'react';

const Post = forwardRef((props, ref) => {
  const { avatar, username, created, content, mediaUrl } = props.post;
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
        }}
      >
        <Avatar src={avatar} sx={{ marginRight: 2 }} />
        <Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: "10px" }}>
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
    </Box>
  );
});

export default Post;
