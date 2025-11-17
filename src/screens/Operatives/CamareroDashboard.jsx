import React from 'react';
import { View, Text } from 'react-native';
import DashboardBase from '../../components/DashboardBase';
import { styles } from '../../styles/AppStyles';

// Vista principal para el rol de Cocinero
const CamareroNavigator = () => (
  <View style={styles.dashboardContainer}>
    {/* Título del panel */}
    <Text style={styles.dashboardTitle}>Dashboard COCINERO</Text>
    
    {/* Descripción de la funcionalidad */}
    <Text style={styles.infoText}>Modificar el status del pedido. (Vista de órdenes por orden de llegada)</Text>
    
    {/* Componente base que incluye el botón de Cerrar Sesión */}
    <DashboardBase />
  </View>
);

export default CamareroNavigator;