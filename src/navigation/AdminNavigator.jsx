import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminMainScreen from '../screens/Admin/AdminMainScreen';
import UserCreationScreen from '../screens/Admin/UserCreationScreen';
import { ProductManagementScreen, ProductFormScreen } from '../screens/Admin/ProductManagementScreen';
import OrderAuditScreen from '../screens/Admin/OrderAuditScreen';
import OrderDetailsScreen from '../screens/Admin/OrderDetailsScreen';

import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import TopProductsScreen from '../screens/Admin/TopProductsScreen';

const AdminStack = createNativeStackNavigator();

export const AdminNavigator = () => (
  <AdminStack.Navigator screenOptions={{
    headerShown: true,
    headerStyle: { backgroundColor: '#007bff' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  }}
  >
    {/* 1. Pantalla Principal del Admin */}
    <AdminStack.Screen
      name="AdminMain"
      component={AdminMainScreen}
      options={{ title: 'Admin Principal' }}
    />

    {/* 1.5. Gestión de Usuarios (Lista) */}
    <AdminStack.Screen
      name="UserManagement"
      component={UserManagementScreen}
      options={{ title: 'Personal' }}
    />

    {/* 2. Creación de Usuarios */}
    <AdminStack.Screen
      name="UserCreation"
      component={UserCreationScreen}
      options={{ title: 'Crear Usuario' }}
    />

    {/* 3. Gestión de Productos (Lista) */}
    <AdminStack.Screen
      name="ProductManagement"
      component={ProductManagementScreen}
      options={{ title: 'Gestión de Productos' }}
    />

    {/* 4. Gestión de Productos (Formulario) */}
    <AdminStack.Screen
      name="ProductForm"
      component={ProductFormScreen}
      options={({ route }) => ({
        title: route.params?.productToEdit ? 'Editar Producto' : 'Crear Producto'
      })}
    />
    {/* 5. Auditoría de Comandas */}
    <AdminStack.Screen
      name="OrderAudit"
      component={OrderAuditScreen}
      options={{ title: 'Auditoría de Comandas' }}
    />

    {/* 6. Detalles de una Comanda específica */}
    <AdminStack.Screen
      name="OrderDetails" // 👈 ESTE ES EL NOMBRE REGISTRADO CORRECTO
      component={OrderDetailsScreen}
      options={{ title: 'Detalles de la Comanda' }}
    />
    {/* 7. Top Productos Más Vendidos */}
    <AdminStack.Screen
      name="TopProducts"
      component={TopProductsScreen}
      options={{ title: 'Lo Más Vendido' }}
    />
  </AdminStack.Navigator>

);