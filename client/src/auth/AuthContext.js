import React, { createContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, refreshToken } from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStorageType = useCallback(() => {
    return localStorage.getItem('accessToken') ? localStorage : sessionStorage;
  }, []);

  const setAuthState = useCallback((accessToken, refreshTokenValue, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshTokenValue);
    setAuthToken(accessToken);
    const decodedToken = jwtDecode(accessToken);
    setUser({
      id: decodedToken.userId,
      username: decodedToken.username,
      email: decodedToken.email,
    });
  }, []);

  const login = useCallback((accessToken, refreshTokenValue, rememberMe) => {
    setAuthState(accessToken, refreshTokenValue, rememberMe);
  }, [setAuthState]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storage = getStorageType();
      const accessToken = storage.getItem('accessToken');
      const refreshTokenValue = storage.getItem('refreshToken');
      
      if (accessToken && refreshTokenValue) {
        try {
          const decodedToken = jwtDecode(accessToken);
          if (Date.now() >= decodedToken.exp * 1000) {
            const newTokens = await refreshToken(refreshTokenValue);
            if (newTokens) {
              setAuthState(newTokens.accessToken, newTokens.refreshToken, storage === localStorage);
            } else {
              logout();
            }
          } else {
            setAuthState(accessToken, refreshTokenValue, storage === localStorage);
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [setAuthState, logout, getStorageType]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;