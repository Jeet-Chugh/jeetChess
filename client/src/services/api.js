import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // base URL
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers["Authorization"];
  }
};

export const refreshToken = async (refreshTokenValue) => {
  try {
    const response = await api.post("/api/user/refresh-token", { refreshToken: refreshTokenValue });
    if (response.data.accessToken && response.data.refreshToken) {
      const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
      storage.setItem('accessToken', response.data.accessToken);
      storage.setItem('refreshToken', response.data.refreshToken);
      setAuthToken(response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

export const makeMove = (gameID, move) => {
  return api.post("/api/game/move", { gameID, move });
};

export const login = (username, password) => {
  return api.post("/api/user/login", { username, password });
};

export const fetchGameState = (gameID) => {
  try {
    const response = api.get(`/api/game/${gameID}`);
    return response;
  } catch (e) {
    console.log("error fetching game", e);
  }
};

export default api;
