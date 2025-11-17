import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MesoneroDashboard from '../screens/Operatives/MesoneroDashboard';
import OrderCreationScreen from '../screens/Operatives/OrderCreationScreen';

const Stack = createNativeStackNavigator();

const MesoneroNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MesoneroMain" component={MesoneroDashboard} />
      <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
    </Stack.Navigator>
  );
};

export default MesoneroNavigator;