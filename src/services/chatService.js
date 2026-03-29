import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyConversations = async () => {
  return await httpClient.get(API.MY_CONVERSATIONS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const createConversation = async (data) => {
  return await httpClient.post(
    API.CREATE_CONVERSATION,
    {
      type: data.type,
      participantIds: data.participantIds,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};


export const createMessage = async (data) => {
  const formData = new FormData();
  formData.append("conversationId", data.conversationId);
  if (data.message) {
    formData.append("message", data.message);
  }

  return await httpClient.post(
    API.CREATE_MESSAGE,
    formData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const createMessageWithImage = async (data) => {
  const formData = new FormData();
  formData.append("conversationId", data.conversationId);
  if (data.message) {
    formData.append("message", data.message);
  }
  if (data.file) {
    formData.append("file", data.file);
  }

  return await httpClient.post(
    API.CREATE_MESSAGE,
    formData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const getMessages = async (conversationId, page = 1, size = 20) => {
  return await httpClient.get(`${API.GET_CONVERSATION_MESSAGES}?conversationId=${conversationId}&page=${page}&size=${size}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const deleteMessage = async (messageId) => {
  return await httpClient.delete(`${API.DELETE_MESSAGE}/${messageId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};