import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importa las pantallas que acabamos de crear/reubicar
import { MesoneroDashboard } from '../screens/Mesonero/MesoneroDashboard';
import { ComandaCreationInitial } from '../screens/Mesonero/ComandaCreationInitial';
import { ComandaDetailsEditor } from '../screens/Mesonero/ComandaDetailsEditor';
import { ComandaDetailsViewer } from '../screens/Mesonero/ComandaDetailsViewer';

// Crea el Stack Navigator para el módulo del Mesonero
const MesoneroStack = createNativeStackNavigator();

export const MesoneroNavigator = () => {
  return (
    <MesoneroStack.Navigator
      initialRouteName="MesoneroDashboard" // La pantalla principal al iniciar sesión como Mesonero
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff', // Color de cabecera primaria
        },
        headerTintColor: '#fff', // Color del texto de la cabecera
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MesoneroStack.Screen
        name="MesoneroDashboard"
        component={MesoneroDashboard}
        options={{ 
          title: 'Panel de Control',
          headerBackVisible: false, // Evita volver a la pantalla anterior si no hay necesidad
        }}
      />
      
      <MesoneroStack.Screen
        name="ComandaCreationInitial"
        component={ComandaCreationInitial}
        options={{ 
          title: 'Crear Comanda (Mesa)',
        }}
      />
      
      <MesoneroStack.Screen
        name="ComandaDetailsEditor"
        component={ComandaDetailsEditor}
        // El título se actualiza dinámicamente en la propia pantalla
        options={{ 
          title: 'Editor de Pedido',
        }}
      />

      {/* AÑADIR NUEVA PANTALLA DE VISTA DE DETALLES */}
      <MesoneroStack.Screen 
        name="ComandaDetailsViewer" 
        component={ComandaDetailsViewer} 
        options={{ headerShown: true, title: 'Detalles del Pedido' }} // Puedes mostrar el header aquí si quieres
      />
      
    </MesoneroStack.Navigator>
  );
};