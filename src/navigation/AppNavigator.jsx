import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';
import { styles } from '../styles/AppStyles';

// Importación de Pantallas y Navegadores
import {LoginScreen} from '../screens/Auth/LoginScreen';
// Rutas explícitas con .jsx para evitar el error de resolución
import {AdminNavigator} from './AdminNavigator.jsx';       
import {CocineroNavigator} from './CocineroNavigator.jsx'; 
import {MesoneroNavigator} from './MesoneroNavigator.jsx'; 

const Stack = createNativeStackNavigator();

// Mapeo de roles de la API a nombres de pantalla
const ROLE_SCREENS = {
  'administrador': 'AdminNavigator', 
  'cocinero': 'CocineroNavigator', 
  'mesonero': 'MesoneroNavigator',
};

export const AppNavigator = () => {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  // Componente a renderizar basado en el rol
  const RoleComponent = () => {
    switch(userRole) {
      case 'administrador':
        return AdminNavigator;
      case 'cocinero':
        return CocineroNavigator;
      case 'mesonero':
        return MesoneroNavigator;
      default:
        // Si el rol no es reconocido, redirigir al login
        return LoginScreen; 
    }
  };

  const RoleName = ROLE_SCREENS[userRole] || 'Login';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        // USUARIO AUTENTICADO: Redirige según el rol (a su respectivo Navegador)
        <Stack.Screen 
          name={RoleName} // Usará AdminNavigator, CamareroNavigator, o MesoneroNavigator
          component={RoleComponent()} 
        />
      ) : (
        // USUARIO NO AUTENTICADO: Ir a la pantalla de Login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};