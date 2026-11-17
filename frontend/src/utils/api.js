import axios from 'axios';

const backendOrigin = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${backendOrigin}/api`,
  withCredentials: true,
  timeout: 8000,
});

export default api;
