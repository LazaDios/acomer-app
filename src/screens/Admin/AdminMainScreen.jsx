import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'; 
import { MaterialIcons } from '@expo/vector-icons';
import DashboardBase from '../../components/DashboardBase';
import { styles } from '../../styles/AppStyles';

// Pantalla Principal del Administrador
const AdminMainScreen = ({ navigation }) => (
  // Usamos DashboardBase, asumiendo que ya tiene flex: 1 y SafeAreaView
  <DashboardBase> 
    {/* Contenedor con padding para el margen de toda la pantalla */}
    <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}> 
        
      {/* Título */}
      <Text style={styles.dashboardTitle}>Panel de Administración</Text>
      <Text style={styles.infoText}>Opciones Rápidas:</Text>
      
      {/* 1. Botón para la creación de usuarios */}
      <TouchableOpacity 
        // Usamos un margin vertical en lugar de margin horizontal para espaciado
        style={[styles.dashboardButton, styles.adminButtonBase, { backgroundColor: '#28a745' }]} 
        onPress={() => navigation.navigate('UserCreation')} 
      >
        <MaterialIcons name="person-add" size={24} color="#fff" />
        <Text style={styles.dashboardButtonText}>Crear Nuevo Usuario</Text>
      </TouchableOpacity>

      {/* 2. Botón para la gestión de productos (CRUD) */}
      <TouchableOpacity 
        style={[styles.dashboardButton, styles.adminButtonBase, { backgroundColor: '#007bff' }]} 
        onPress={() => navigation.navigate('ProductManagement')}
      >
        <MaterialIcons name="restaurant-menu" size={24} color="#fff" />
        <Text style={styles.dashboardButtonText}>Gestión de Productos</Text>
      </TouchableOpacity>
      
      {/* 3. Botón para la Auditoría de Comandas */}
      <TouchableOpacity 
        // El color de fondo es warning, el texto debe ser oscuro
        style={[styles.dashboardButton, styles.adminButtonBase, { backgroundColor: '#ffc107' }]} 
        onPress={() => navigation.navigate('OrderAudit')}
      >
        <MaterialIcons name="receipt-long" size={24} color="#333" />
        {/* El texto debe ser de color oscuro si el fondo es claro (Amarillo) */}
        <Text style={[styles.dashboardButtonText, { color: '#333' }]}>Auditoría de Comandas</Text> 
      </TouchableOpacity>

      <Text style={[styles.infoText, { marginTop: 20 }]}>Aquí se gestionan usuarios, productos y se auditan las órdenes del sistema.</Text>
    
    </ScrollView>
  </DashboardBase>
);

export default AdminMainScreen;