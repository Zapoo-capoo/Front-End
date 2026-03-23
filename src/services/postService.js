import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyPosts = async (page) => {
  return await httpClient.get(API.MY_POST, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    params: {
      page: page,
      size: 10,
    },
  });
};

export const getFriendPosts = async (page) => {
  return await httpClient.get(API.FRIEND_POSTS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    params: {
      page: page,
      size: 10,
    },
  });
};

export const createPost = async (content) => {
  return await httpClient.post(
    API.CREATE_POST,
    { content: content },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const createPostWithMedia = async (content, file) => {
  const formData = new FormData();

  if (content?.trim()) {
    formData.append("content", content.trim());
  }

  if (file) {
    formData.append("file", file);
  }

  return await httpClient.post(API.CREATE_POST_WITH_MEDIA, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deletePost = async (postId) => {
  return await httpClient.delete(`${API.DELETE_POST}/${postId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};
