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
