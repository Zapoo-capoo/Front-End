import { getToken, removeToken, setToken } from "./localStorageService";
import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

export const logIn = async (username, password) => {
  const response = await httpClient.post(API.LOGIN, {
    username: username,
    password: password,
  });

  setToken(response.data?.result?.token);

  return response;
};

export const register = async (payload) => {
  return await httpClient.post(API.REGISTRATION, payload);
};

export const authenticateWithGoogle = async (code) => {
  const response = await httpClient.post(
    `${API.GOOGLE_AUTHENTICATE}?code=${encodeURIComponent(code)}`
  );

  setToken(response.data?.result?.token);

  return response;
};

export const logOut = () => {
  removeToken();
};

export const isAuthenticated = () => {
  return getToken();
};
