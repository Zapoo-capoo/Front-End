import * as React from "react";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import ChatIcon from "@mui/icons-material/Chat";
import { Link } from "react-router-dom";

function SideMenu() {
  return (
    <>
      <Toolbar />
      <List>
        <ListItem key={"home"} disablePadding>
          <ListItemButton component={Link} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText
              primary={"Home"}
              primaryTypographyProps={{ style: { fontWeight: "bold" } }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem key={"friends"} disablePadding>
          <ListItemButton component={Link} to="/friends">
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText
              primary={"Friends"}
              primaryTypographyProps={{ style: { fontWeight: "bold" } }}
            />
          </ListItemButton>
        </ListItem>{" "}
        <ListItem key={"my-post"} disablePadding>
          <ListItemButton component={Link} to="/my-posts">
            <ListItemIcon>
              <ArticleIcon />
            </ListItemIcon>
            <ListItemText
              primary={"My Post"}
              primaryTypographyProps={{ style: { fontWeight: "bold" } }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem key={"chat"} disablePadding>
          <ListItemButton component={Link} to="/chat">
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText
              primary={"Chat"}
              primaryTypographyProps={{ style: { fontWeight: "bold" } }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
    </>
  );
}

export default SideMenu;
