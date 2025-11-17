import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { styles } from '../styles/AppStyles';

// Dashboard Base para renderizar el botón de Logout
// Este componente envuelve el contenido principal del dashboard y añade un pie de página
// con el botón de "Cerrar Sesión".
const DashboardBase = ({ children }) => {
  const { logout } = useContext(AuthContext);
  return (
    // Usamos View para el contenedor del pie de página y el botón de logout
    <View style={styles.dashboardBaseFooter}>
      {/* children representa el contenido principal de la pantalla que usa este componente */}
      {children}
      
      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity 
        // Aplicamos estilos del botón general y el estilo específico para logout
        style={[styles.button, styles.logoutButton]} 
        onPress={logout} // Función para cerrar sesión del AuthContext
      >
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DashboardBase;