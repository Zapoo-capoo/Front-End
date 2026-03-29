export const KEY_TOKEN = "accessToken";

export const setToken = (token) => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(KEY_TOKEN);
};

export const removeToken = () => {
  return localStorage.removeItem(KEY_TOKEN);
};

/**
 * Decode JWT token and extract payload
 * JWT format: header.payload.signature
 */
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

/**
 * Get current user ID from token
 */
export const getCurrentUserId = () => {
  const token = getToken();
  if (!token) return null;
  
  const payload = decodeJWT(token);
  // JWT payload typically has 'sub' for user ID or 'userId'
  return payload?.sub || payload?.userId || null;
};
