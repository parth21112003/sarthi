import React, { createContext, useReducer, useEffect, useContext } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext();

const initialState = {
  user: null,
  accessToken: null,
  loading: true,
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await authService.refreshToken();
        if (data && data.accessToken) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: data.user, accessToken: data.accessToken }
          });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.loginUser(email, password);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user: data.user, accessToken: data.accessToken }
    });
    return data;
  };

  const register = async (userData) => {
    const data = await authService.registerUser(userData);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user: data.user, accessToken: data.accessToken }
    });
    return data;
  };

  const logout = async () => {
    await authService.logoutUser();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    const data = await userService.updateProfile(profileData);
    dispatch({ type: 'UPDATE_USER', payload: data.user });
    return data;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
