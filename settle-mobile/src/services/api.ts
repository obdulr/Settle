import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4025';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@settle_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
