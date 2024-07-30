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

const getStorage = () => {
  return localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
};

export const refreshToken = async (refreshTokenValue) => {
  try {
    const response = await axios.post("http://localhost:5000/api/user/refresh-token", { refreshToken: refreshTokenValue });
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

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const storage = getStorage();
    let accessToken = storage.getItem('accessToken');
    let refreshTokenValue = storage.getItem('refreshToken');

    if (refreshTokenValue) {
      try {
        const refreshResult = await refreshToken(refreshTokenValue);
        if (refreshResult && refreshResult.accessToken) {
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const storage = getStorage();
      const refreshTokenValue = storage.getItem('refreshToken');
      if (refreshTokenValue) {
        try {
          const refreshResult = await refreshToken(refreshTokenValue);
          if (refreshResult && refreshResult.accessToken) {
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

export const makeMove = (gameID, move) => {
  return api.post("/api/game/move", { gameID, move });
};

export const register = (username, password, email) => {
  return api.post("/api/user/register", { username, password, email });
};

export const login = (username, password) => {
  return api.post("/api/user/login", { username, password });
};

export const fetchGameState = (gameID) => {
  return api.get(`/api/game/${gameID}`);
};

export const resignGame = (gameID) => {
  return api.post(`/api/game/${gameID}/resign`);
};

export const offerDraw = (gameID) => {
  return api.post(`/api/game/${gameID}/offer-draw`);
};

export const acceptDraw = (gameID) => {
  return api.post(`/api/game/${gameID}/accept-draw`);
};

export const createGame = (gameData) => {
  return api.post("/api/game/start", gameData);
};

export const getUserByUsername = (username) => {
  return api.get(`/api/user/by-username/${username}`);
};

export const fetchUserGames = () => {
  return api.get("/api/game/my-games");
};

export default api;