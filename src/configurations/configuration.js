export const CONFIG = {
  API_GATEWAY: "http://localhost:8888/api/v1",
};

export const OAUTH_CONFIG = {
  CLIENT_ID:
    "967957208661-sho8ed65f1vqpq71bla7b9f3dv7c5su4.apps.googleusercontent.com",
  AUTH_URI: "https://accounts.google.com/o/oauth2/auth",
  REDIRECT_PATH: "/authenticate",
};

export const API = {
  LOGIN: "/identity/auth/token",
  REGISTRATION: "/identity/users/registration",
  GOOGLE_AUTHENTICATE: "/identity/auth/outbound/authentication",
  IDENTITY_MY_INFO: "/identity/users/my-info",
  MY_INFO: "/profile/users/my-profile",
  USER_PROFILE: "/profile/users",
  CREATE_PASSWORD: "/identity/users/create-password",
  MY_POST: "/post/my-posts",
  FRIEND_POSTS: "/post/friends-posts",
  CREATE_POST: "/post/create",
  CREATE_POST_WITH_MEDIA: "/post/create-with-media",
  DELETE_POST: "/post",
  UPDATE_PROFILE: "/profile/users/my-profile",
  UPDATE_AVATAR: "/profile/users/avatar",
  SEARCH_USER: "/profile/users/search",
  MY_FRIENDS: "/profile/friends/friends",
  SENT_FRIEND_REQUESTS: "/profile/friends/sent",
  RECEIVED_FRIEND_REQUESTS: "/profile/friends/received",
  SEND_FRIEND_REQUEST: "/profile/friends/request",
  REJECT_FRIEND_REQUEST: "/profile/friends/reject",
  UNFRIEND: "/profile/friends/unfriend",
  MY_CONVERSATIONS: "/chat/conversations/my-conversations",
  CREATE_CONVERSATION: "/chat/conversations/create",
  CREATE_GROUP_CONVERSATION: "/chat/conversations/group/create",
  CREATE_MESSAGE: "/chat/messages/create",
  GET_CONVERSATION_MESSAGES: "/chat/messages",
  DELETE_MESSAGE: "/chat/messages",
};
