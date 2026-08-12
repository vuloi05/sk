import axios from 'axios';
import { store } from './store.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Backend URL
});

// Interceptor: Gắn JWT Token vào header của mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dictaflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Các hàm gọi Auth API
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const googleLogin = async (token) => {
  const { data } = await api.post('/auth/google', { token });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
  return data;
};

export const verifyOTP = async (email, otp) => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
};

export const resendOTP = async (email) => {
  const { data } = await api.post('/auth/resend-otp', { email });
  return data;
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem('dictaflow_token');
  localStorage.removeItem('dictaflow_user');
  store.set('currentUser', null);
};

// API Bài học
export const fetchLessonsAPI = async () => {
  const { data } = await api.get('/lessons');
  return data;
};

export const fetchLessonByIdAPI = async (id) => {
  const { data } = await api.get(`/lessons/${id}`);
  return data;
};

export const deleteLessonAPI = async (id) => {
  const { data } = await api.delete(`/lessons/${id}`);
  return data;
};

// Cập nhật tiến độ học tập (Từng câu)
export const saveProgressAPI = async (lesson_id, sentence_id, score_earned, mistake = null) => {
  try {
    const { data } = await api.post('/progress/update', {
      lesson_id,
      sentence_id,
      score_earned,
      mistake
    });
    return data;
  } catch (err) {
    console.error('Không thể lưu tiến độ:', err);
    return null;
  }
};

// Lấy user từ localStorage khi mới vào web
export const initAuth = () => {
  const user = localStorage.getItem('dictaflow_user');
  if (user) {
    try {
      store.set('currentUser', JSON.parse(user));
    } catch (e) {
      logout();
    }
  } else {
    store.set('currentUser', null);
  }
};

export default api;
