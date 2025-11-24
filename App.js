// App.js (O TU COMPONENTE RAÍZ)

import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; // ÚNICO LUGAR
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer> 
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}