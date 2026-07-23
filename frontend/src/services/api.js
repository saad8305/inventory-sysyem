import axios from 'axios';
import { toast } from 'react-hot-toast';
const API_BASE_URL = 'http://127.0.0.1:8000/api/';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response) {
      const status = error.response.status;
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refresh = localStorage.getItem('refresh_token');
          if (!refresh) throw new Error('No refresh token');

          const response = await axiosInstance.post('token/refresh/', { refresh });
          const newAccessToken = response.data.access;

          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      if (status === 400) toast.error('داده‌های ارسالی معتبر نیست.');
      else if (status === 403) toast.error('شما اجازه دسترسی به این بخش را ندارید.');
      else if (status >= 500) toast.error('خطایی در سرور رخ داده است.');
    } else {
      toast.error('خطا در برقراری ارتباط با سرور.');
    }

    return Promise.reject(error);
  }
);

export const loginUser = (Credential) => api.post('token/', Credential);
export const refreshToken = (refresh) => axiosInstance.post('token/refresh/', { refresh });

export const getProducts = () => api.get('products/');
export const createProduct = (data) => api.post('products/', data);
export const updateProduct = (id, data) => api.put(`products/${id}/`, data);
export const deleteProduct = (id) => api.delete(`products/${id}/`);

export const getWarehouses = () => api.get('warehouses/');
export const createWarehouse = (data) => api.post('warehouses/', data);
export const updateWarehouse = (id, data) => api.put(`warehouses/${id}/`, data);
export const deleteWarehouse = (id) => api.delete(`warehouses/${id}/`);

export const getCategories = () => api.get('categories/');
export const createCategory = (data) => api.post('categories/', data);
export const updateCategory = (id, data) => api.put(`categories/${id}/`, data);
export const deleteCategory = (id) => api.delete(`categories/${id}/`);

export const getStocks = () => api.get('stocks/');

export const getTransactions = () => api.get('transactions/');
export const createTransaction = (data) => api.post('transactions/', data);
export const updateProfile = (data) => {
  return api.patch('users/profile/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getProfile = () => {
  return api.get('users/profile/');
};