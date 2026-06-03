import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('review_user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } else {
    // If no user in localStorage, send mock_token just in case it's the mock user testing
    // The backend will accept it if we added the backdoor
    config.headers.Authorization = `Bearer mock_token`;
  }
  // Allow sending cookies (like macfeed_session)
  config.withCredentials = true;
  return config;
});

export default api;
