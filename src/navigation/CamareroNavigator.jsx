import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CamareroDashboard from '../screens/Operatives/CamareroDashboard';
import OrderListScreen from '../screens/Operatives/OrderListScreen';

const Stack = createNativeStackNavigator();

const CamareroNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CamareroMain" component={CamareroDashboard} />
      <Stack.Screen name="OrderList" component={OrderListScreen} />
    </Stack.Navigator>
  );
};

export default CamareroNavigator;