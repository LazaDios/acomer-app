import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Estructura principal de la aplicación
export default function App() {
  return (
    <NavigationContainer>
      {/* 1. Proveedor de Contexto (Autenticación, Login/Logout) */}
      <AuthProvider>
        {/* 2. Navegador Principal (Lógica condicional de redirección por rol) */}
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}