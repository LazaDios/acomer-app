import React, { useState, useEffect, createContext } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// --- 1. CONFIGURACIÓN DE LA API ---
// ***************************************************************
// !!! IMPORTANTE: CAMBIA 'TU_IP_LOCAL' POR LA IP DE TU PC !!!
const API_BASE_URL = 'http://192.168.1.3:3000/api/v1'; // Usa la base de tu App.js
// ***************************************************************
const TOKEN_KEY = 'user_token';
const USER_ROLE_KEY = 'user_role';
const RESTAURANT_KEY = 'restaurant_data';

// Mapeo de roles 
export const AVAILABLE_ROLES = ['administrador', 'cocinero', 'mesonero'];

// --- 2. CREACIÓN DEL CONTEXTO ---
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuración de Google Auth (Mantenemos por si acaso, pero no se usará principalmente)
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '815662594498-ibipgvbekrjt5jvpgnh79kdm4mjdd43k.apps.googleusercontent.com',
    webClientId: '815662594498-ibipgvbekrjt5jvpgnh79kdm4mjdd43k.apps.googleusercontent.com',
    androidClientId: '815662594498-ibipgvbekrjt5jvpgnh79kdm4mjdd43k.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@lazarodios/acomer-app',
  });

  // Carga inicial (Intenta recuperar el token al iniciar la app)
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const role = await SecureStore.getItemAsync(USER_ROLE_KEY);
        const storedRestaurant = await SecureStore.getItemAsync(RESTAURANT_KEY);

        if (storedRestaurant) {
          setRestaurant(JSON.parse(storedRestaurant));
        }

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

  // Manejar respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleLogin(authentication.idToken);
      }
    }
  }, [response]);

  // Función de Login
  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
        id_restaurante: restaurant ? restaurant.id_restaurante : undefined,
      });

      const accessToken = response.data.access_token;
      const role = response.data.usuario.rol;

      if (accessToken && role) {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_ROLE_KEY, role);

        setUserToken(accessToken);
        setUserRole(role);
        Alert.alert('Éxito', 'Inicio de sesión exitoso. Redirigiendo...');
      } else {
        Alert.alert('Error', 'Respuesta de la API incompleta.');
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

  // Función LOGIN ESPECIAL para el WelcomeScreen (Solo activa el restaurante)
  const activateRestaurantPromise = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { restaurant } = response.data;

      if (restaurant) {
        await SecureStore.setItemAsync(RESTAURANT_KEY, JSON.stringify(restaurant));
        setRestaurant(restaurant);
        Alert.alert('¡Conectado!', `Has conectado con el restaurante ${restaurant.nombre}. Ahora inicia sesión con tu usuario.`);
        // NO seteamos el userToken, así el AppNavigator nos lleva al LoginScreen
      } else {
        Alert.alert('Error', 'Este usuario no tiene un restaurante asociado.');
      }

    } catch (error) {
      console.error('Error al activar restaurante:', error);
      const message = error.response?.data?.message || 'Credenciales inválidas.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Login con Google
  const loginWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error al iniciar Google Sign-In:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
    }
  };

  const handleGoogleLogin = async (idToken) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        token: idToken,
      });

      const { restaurant, localAdmin } = response.data;

      if (restaurant) {
        await SecureStore.setItemAsync(RESTAURANT_KEY, JSON.stringify(restaurant));
        setRestaurant(restaurant);

        if (localAdmin) {
          Alert.alert(
            '¡Restaurante Creado!',
            `Se ha creado un usuario administrador local para tu restaurante.\n\nUsuario: ${localAdmin.username}\nContraseña: ${localAdmin.password}\n\nGuarda estos datos para que tus empleados puedan iniciar sesión.`,
            [{ text: 'Entendido' }]
          );
        } else {
          Alert.alert('Bienvenido', `Has seleccionado el restaurante: ${restaurant.nombre}`);
        }
      } else {
        Alert.alert('Aviso', 'No se encontró información del restaurante asociado.');
      }

    } catch (error) {
      console.error('❌ Google Login Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      Alert.alert('Error', `Error al iniciar sesión con Google: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Registro de Restaurante (Email/Password)
  const registerRestaurant = async (data) => {
    setIsLoading(true);
    try {
      console.log('📤 Enviando registro de restaurante...');
      const response = await axios.post(`${API_BASE_URL}/auth/register-restaurant`, data);

      console.log('✅ Restaurante registrado exitosamente', response.data);
      console.log('✅ Restaurante registrado exitosamente', response.data);
      const { restaurant, access_token, usuario } = response.data;

      if (restaurant) {
        await SecureStore.setItemAsync(RESTAURANT_KEY, JSON.stringify(restaurant));
        setRestaurant(restaurant);

        // Auto-login del dueño
        if (access_token && usuario) {
          await SecureStore.setItemAsync(TOKEN_KEY, access_token);
          await SecureStore.setItemAsync(USER_ROLE_KEY, usuario.rol);
          setUserToken(access_token);
          setUserRole(usuario.rol);
          Alert.alert('¡Bienvenido!', `Restaurante "${restaurant.nombre}" registrado correctamente.`);
        }
      }

    } catch (error) {
      console.error('❌ Error al registrar restaurante:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      Alert.alert('Error', `No se pudo registrar el restaurante: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
    setUserToken(null);
    setUserRole(null);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
  };

  const changeRestaurant = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
    await SecureStore.deleteItemAsync(RESTAURANT_KEY);
    setUserToken(null);
    setUserRole(null);
    setRestaurant(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, restaurant, login, loginWithGoogle, registerRestaurant, logout, changeRestaurant, activateRestaurant: activateRestaurantPromise, isLoading, API_BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};