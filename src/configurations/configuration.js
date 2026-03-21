export const CONFIG = {
  API_GATEWAY: "http://localhost:8888/api/v1",
};

export const OAUTH_CONFIG = {
  CLIENT_ID:
    "514738420681-5via058evbtsra053qirvn1q25gq4gqo.apps.googleusercontent.com",
  AUTH_URI: "https://accounts.google.com/o/oauth2/auth",
  REDIRECT_PATH: "/authenticate",
};

export const API = {
  LOGIN: "/identity/auth/token",
  REGISTRATION: "/identity/users/registration",
  GOOGLE_AUTHENTICATE: "/identity/auth/outbound/authentication",
  IDENTITY_MY_INFO: "/identity/users/my-info",
  MY_INFO: "/profile/users/my-profile",
  CREATE_PASSWORD: "/identity/users/create-password",
  MY_POST: "/post/my-posts",
  CREATE_POST: "/post/create",
  UPDATE_PROFILE: "/profile/users/my-profile",
  UPDATE_AVATAR: "/profile/users/avatar",
  SEARCH_USER: "/profile/users/search",
  MY_CONVERSATIONS: "/chat/conversations/my-conversations",
  CREATE_CONVERSATION: "/chat/conversations/create",
  CREATE_MESSAGE: "/chat/messages/create",
  GET_CONVERSATION_MESSAGES: "/chat/messages",
};
