import axios from 'axios';
import { Alert } from 'react-native';

// TODO: Replace with your actual backend URL
// For Android Emulator use 10.0.2.2, for physical device use your IP 
const API_URL = 'https://acomer-v1.onrender.com/api/v1/auth';

// Asegurar headers para ngrok en todas las peticiones de este archivo si es necesario
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export const authService = {
    login: async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { username, password });
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    googleLogin: async (token) => {
        try {
            const response = await axios.post(`${API_URL}/google-login`, { token });
            return response.data;
        } catch (error) {
            console.error('Google Login error:', error);
            throw error;
        }
    },

    register: async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/register`, userData);
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }
};
