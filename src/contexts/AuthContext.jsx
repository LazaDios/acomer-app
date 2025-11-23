import React, { useState, useEffect, createContext } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// --- 1. CONFIGURACIÓN DE LA API ---
// ***************************************************************
// !!! IMPORTANTE: CAMBIA 'TU_IP_LOCAL' POR LA IP DE TU PC !!!
const API_BASE_URL = 'http://192.168.1.9:3000/api/v1'; // Usa la base de tu App.js
// ***************************************************************
const TOKEN_KEY = 'user_token';
const USER_ROLE_KEY = 'user_role';

// Mapeo de roles 
export const AVAILABLE_ROLES = ['administrador', 'cocinero', 'mesonero']; 

// --- 2. CREACIÓN DEL CONTEXTO ---
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial (Intenta recuperar el token al iniciar la app)
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const role = await SecureStore.getItemAsync(USER_ROLE_KEY);
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error al cargar datos de almacenamiento:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // Función de Login
  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });

      // Mapeo de la respuesta REAL de la API (tal como la tienes en App.js)
      const accessToken = response.data.access_token; 
      const role = response.data.usuario.rol; 
      
      if (accessToken && role) { 
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_ROLE_KEY, role);
        
        setUserToken(accessToken);
        setUserRole(role);
        Alert.alert('Éxito', 'Inicio de sesión exitoso. Redirigiendo...');
      } else {
        Alert.alert('Error', 'Respuesta de la API incompleta: token o rol no recibidos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      const message = error.response?.data?.message || 'Error de conexión o credenciales inválidas.';
      Alert.alert('Error de Login', message);
      setUserToken(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Logout
  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
    setUserToken(null);
    setUserRole(null);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, login, logout, isLoading, API_BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};