import axios from "axios";

const BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getStorage = () => localStorage.getItem('refreshToken') ? localStorage : sessionStorage;

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers["Authorization"];
  }
};

export const refreshToken = async (refreshTokenValue) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/user/refresh-token`, { refreshToken: refreshTokenValue });
    if (response.data.accessToken && response.data.refreshToken) {
      const storage = getStorage();
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

// Game endpoints
export const createGame = (gameData) => api.post("/api/game/start", gameData);
export const fetchGameState = (gameID) => api.get(`/api/game/${gameID}`);
export const makeMove = (gameID, move) => api.post("/api/game/move", { gameID, move });
export const offerDraw = (gameID) => api.post(`/api/game/${gameID}/offer-draw`);
export const acceptDraw = (gameID) => api.post(`/api/game/${gameID}/accept-draw`);
export const resignGame = (gameID) => api.post(`/api/game/${gameID}/resign`);


// User endpoints
export const register = (username, password, email) => api.post("/api/user/register", { username, password, email });
export const login = (username, password) => api.post("/api/user/login", { username, password });
export const getUserByUsername = (username) => api.get(`/api/user/by-username/${username}`);
export const fetchUserGames = () => api.get("/api/game/my-games");
export const changeUsername = (newUsername) => api.post('/api/user/change-username', { newUsername });
export const changePassword = (currentPassword, newPassword) => api.post('/api/user/change-password', { currentPassword, newPassword });
export const deleteAccount = () => api.delete('/api/user/delete-account');

api.interceptors.request.use(
  async (config) => {
    const storage = getStorage();
    let accessToken = storage.getItem('accessToken');
    const refreshTokenValue = storage.getItem('refreshToken');

    if (refreshTokenValue) {
      try {
        const refreshResult = await refreshToken(refreshTokenValue);
        if (refreshResult?.accessToken) {
          accessToken = refreshResult.accessToken;
        }
      } catch (error) {
        console.error("Error in token refresh:", error);
      }
    }

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const storage = getStorage();
      const refreshTokenValue = storage.getItem('refreshToken');
      if (refreshTokenValue) {
        try {
          const refreshResult = await refreshToken(refreshTokenValue);
          if (refreshResult?.accessToken) {
            setAuthToken(refreshResult.accessToken);
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);