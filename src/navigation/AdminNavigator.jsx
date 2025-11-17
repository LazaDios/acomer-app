import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminMainScreen from '../screens/Admin/AdminMainScreen';
import UserCreationScreen from '../screens/Admin/UserCreationScreen';
import { ProductManagementScreen, ProductFormScreen } from '../screens/Admin/ProductManagementScreen';
import OrderAuditScreen from '../screens/Admin/OrderAuditScreen'; //por crear

const AdminStack = createNativeStackNavigator();

const AdminNavigator = () => (
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
  </AdminStack.Navigator>
);

export default AdminNavigator;