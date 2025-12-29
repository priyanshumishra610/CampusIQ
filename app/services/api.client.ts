import axios, {AxiosInstance, AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      async config => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem('auth_token');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('auth_token');
          this.token = null;
          // You might want to dispatch a logout action here
        }
        return Promise.reject(error);
      },
    );
  }

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    AsyncStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {email, password});
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    adminRole?: string;
    department?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.clearToken();
  }

  // Generic methods
  async get(endpoint: string, params?: any) {
    const response = await this.client.get(endpoint, {params});
    return response.data;
  }
  
  async patch(endpoint: string, data?: any) {
    const response = await this.client.patch(endpoint, data);
    return response.data;
  }

  async post(endpoint: string, data?: any) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put(endpoint: string, data?: any) {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint: string) {
    const response = await this.client.delete(endpoint);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

