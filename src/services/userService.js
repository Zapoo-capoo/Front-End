import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyInfo = async () => {
  return await httpClient.get(API.MY_INFO, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getUserProfile = async (profileId) => {
  return await httpClient.get(`${API.USER_PROFILE}/${profileId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getIdentityMyInfo = async () => {
  return await httpClient.get(API.IDENTITY_MY_INFO, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const createPassword = async (username, password) => {
  return await httpClient.post(
    API.CREATE_PASSWORD,
    {
      username,
      password,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const updateProfile = async (profileData) => {
  return await httpClient.put(API.UPDATE_PROFILE, profileData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });
};

export const uploadAvatar = async (formData) => {
  return await httpClient.put(API.UPDATE_AVATAR, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const search = async (keyword) => {
  return await httpClient.post(
    API.SEARCH_USER,
    { keyword: keyword },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const getMyFriends = async () => {
  return await httpClient.get(API.MY_FRIENDS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getSentFriendRequests = async () => {
  return await httpClient.get(API.SENT_FRIEND_REQUESTS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getReceivedFriendRequests = async () => {
  return await httpClient.get(API.RECEIVED_FRIEND_REQUESTS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const sendFriendRequest = async (username) => {
  return await httpClient.post(API.SEND_FRIEND_REQUEST, null, {
    params: { username },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const unfriend = async (id) => {
  return await httpClient.post(API.UNFRIEND, null, {
    params: { id },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const rejectFriendRequest = async (id) => {
  return await httpClient.post(API.REJECT_FRIEND_REQUEST, null, {
    params: { id },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};
