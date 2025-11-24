import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CocineroDashboard } from '../screens/Cocinero/CocineroDashboard'; 

const CocineroStack = createNativeStackNavigator();

export const CocineroNavigator = () => {
  return (
    <CocineroStack.Navigator screenOptions={{ headerShown: false }}>
      <CocineroStack.Screen name="CocineroDashboard" component={CocineroDashboard} />
      {/* Aquí podrías añadir pantallas futuras si el cocinero necesitara ver estadísticas, etc. */}
    </CocineroStack.Navigator>
  );
};