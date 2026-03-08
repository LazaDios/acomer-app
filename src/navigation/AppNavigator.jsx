import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';
import { styles } from '../styles/AppStyles';

// Importación de Pantallas y Navegadores
import { LoginScreen } from '../screens/Auth/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
// Rutas explícitas con .jsx para evitar el error de resolución
import { AdminNavigator } from './AdminNavigator.jsx';
import { CocineroNavigator } from './CocineroNavigator.jsx';
import { MesoneroNavigator } from './MesoneroNavigator.jsx';

const Stack = createNativeStackNavigator();

// Mapeo de roles de la API a nombres de pantalla
const ROLE_SCREENS = {
  'administrador': 'AdminNavigator',
  'cocinero': 'CocineroNavigator',
  'mesonero': 'MesoneroNavigator',
};

export const AppNavigator = () => {
  const { userToken, userRole, restaurant, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        // USUARIO AUTENTICADO: Redirige según el rol
        <>
          {userRole === 'administrador' && (
            <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
          )}
          {userRole === 'cocinero' && (
            <Stack.Screen name="CocineroNavigator" component={CocineroNavigator} />
          )}
          {userRole === 'mesonero' && (
            <Stack.Screen name="MesoneroNavigator" component={MesoneroNavigator} />
          )}
          {!ROLE_SCREENS[userRole] && (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </>
      ) : restaurant ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}
    </Stack.Navigator>
  );
};