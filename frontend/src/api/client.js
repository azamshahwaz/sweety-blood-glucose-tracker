
import axios from 'axios';

export const TAB_SESSION_KEY = 'sweety_tab_session';

export const getTabSession = () => {
  return sessionStorage.getItem(TAB_SESSION_KEY);
};

export const setTabSession = (token) => {
  sessionStorage.setItem(TAB_SESSION_KEY, token);
};

export const clearTabSession = () => {
  sessionStorage.removeItem(TAB_SESSION_KEY);
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = getTabSession();

  if (token) {
    config.headers['X-Tab-Session'] = token;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const isLoginOrRegister =
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/register');

    if (status === 401 && !isLoginOrRegister) {
      clearTabSession();

      window.dispatchEvent(
        new Event('auth:unauthorized')
      );
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  (error?.request
    ? 'Cannot reach the server. Please check your connection.'
    : 'Something went wrong.');

export const getFieldErrors = (error) =>
  error?.response?.data?.errors || {};

export default client;
