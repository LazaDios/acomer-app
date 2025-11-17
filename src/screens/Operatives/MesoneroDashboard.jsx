import React from 'react';
import { View, Text } from 'react-native';
import DashboardBase from '../../components/DashboardBase';
import { styles } from '../../styles/AppStyles';

const MesoneroNavigator = () => (
  <View style={styles.dashboardContainer}>
    <Text style={styles.dashboardTitle}>Dashboard MESONERO</Text>
    <Text style={styles.infoText}>Tienes permisos para crear nuevas órdenes. (atender a los clientes)</Text>
    <DashboardBase />
  </View>
);

export default MesoneroNavigator;