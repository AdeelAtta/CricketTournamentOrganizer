import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(error);
    } else if (error.request) {
      return Promise.reject(new Error('Connection error: Backend is not responding'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default apiClient;
