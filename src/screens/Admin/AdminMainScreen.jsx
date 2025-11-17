import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardBase from '../../components/DashboardBase';
import { styles } from '../../styles/AppStyles';

// Pantalla Principal del Administrador
const AdminMainScreen = ({ navigation }) => (
  // 1. Usar DashboardBase como componente contenedor
  <DashboardBase> 
    <Text style={styles.dashboardTitle}>Panel de Administración</Text>
    <Text style={styles.infoText}>Opciones Rápidas:</Text>
    
    {/* 1. Botón para la creación de usuarios */}
    <TouchableOpacity 
      style={[styles.dashboardButton, { backgroundColor: '#28a745' }]} 
      // 2. Navegar a la ruta "UserCreation" (definida en AdminNavigator)
      onPress={() => navigation.navigate('UserCreation')} 
    >
      <MaterialIcons name="person-add" size={24} color="#fff" />
      <Text style={styles.dashboardButtonText}>Crear Nuevo Usuario</Text>
    </TouchableOpacity>

    {/* 2. Botón para la gestión de productos (CRUD) */}
    <TouchableOpacity 
      style={[styles.dashboardButton, { backgroundColor: '#007bff' }]} 
      onPress={() => navigation.navigate('ProductManagement')}
    >
      <MaterialIcons name="restaurant-menu" size={24} color="#fff" />
      <Text style={styles.dashboardButtonText}>Gestión de Productos</Text>
    </TouchableOpacity>
    
    {/* 3. Botón para la Auditoría de Comandas (AÑADIDO) */}
    <TouchableOpacity 
      style={[styles.dashboardButton, { backgroundColor: '#ffc107', marginTop: 10 }]} 
      onPress={() => navigation.navigate('OrderAudit')}
    >
      <MaterialIcons name="receipt-long" size={24} color="#333" />
      <Text style={[styles.dashboardButtonText, { color: '#333' }]}>Auditoría de Comandas</Text>
    </TouchableOpacity>

    <Text style={styles.infoText}>Aquí se gestionan usuarios, productos y se auditan las órdenes del sistema.</Text>
  </DashboardBase>
);

export default AdminMainScreen;