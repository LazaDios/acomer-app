import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';
import axios from 'axios';

const OrderListScreen = ({ navigation }) => {
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // Refrescar automáticamente cada 30 segundos
    const interval = setInterval(fetchOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  // **********************************************
  // LÓGICA DE CARGA DE PEDIDOS
  // **********************************************
  const fetchOrders = async () => {
    // Solo cargamos órdenes en estado PENDIENTE o EN PREPARACIÓN
    const statuses = ['PENDIENTE', 'EN PREPARACION'];
    const statusQuery = statuses.map(s => `status=${s}`).join('&');

    try {
      // Endpoint: /api/v1/orders?status=PENDIENTE&status=EN PREPARACION
      const response = await axios.get(`${API_BASE_URL}/orders?${statusQuery}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // Ordenar por hora de creación
      setOrders(response.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos de cocina.');
    } finally {
      setIsLoading(false);
    }
  };

  // **********************************************
  // LÓGICA DE ACTUALIZACIÓN DE ESTADO
  // **********************************************
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Endpoint: /api/v1/orders/{orderId}/status
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      Alert.alert('Éxito', `Pedido ${orderId} actualizado a ${newStatus}.`);
      // Refrescar la lista de pedidos después de la actualización
      fetchOrders(); 
      
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      const message = error.response?.data?.message || 'Error al actualizar el estado del pedido.';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    }
  };

  // **********************************************
  // COMPONENTES DE VISTA
  // **********************************************
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d9534f" />
        <Text style={styles.loadingText}>Cargando pedidos para cocina...</Text>
      </View>
    );
  }

  // Define el color de fondo de la tarjeta basado en el estado
  const getStatusStyle = (status) => {
    switch(status) {
      case 'PENDIENTE': return { backgroundColor: '#f0ad4e', color: '#333' }; // Amarillo
      case 'EN PREPARACION': return { backgroundColor: '#5bc0de', color: '#fff' }; // Azul Claro
      case 'LISTO': return { backgroundColor: '#28a745', color: '#fff' }; 
      default: return { backgroundColor: '#fff', color: '#333' };
    }
  };

  const OrderCard = ({ order }) => {
    const statusStyle = getStatusStyle(order.status);
    const time = new Date(order.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
          <View style={[styles.orderStatusPill, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.orderStatusText, { color: statusStyle.color }]}>
              {order.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.orderDetailText}>Mesa: {order.tableNumber}</Text>
        <Text style={styles.orderDetailText}>Hora: {time}</Text>

        <Text style={styles.orderItemsTitle}>Ítems:</Text>
        {order.items.map((item, index) => (
          <Text key={index} style={styles.orderItemText}>
            {item.quantity}x {item.name}
          </Text>
        ))}

        <View style={styles.orderActions}>
          {order.status === 'PENDIENTE' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#5bc0de' }]}
              onPress={() => updateOrderStatus(order.id, 'EN PREPARACION')}
            >
              <Text style={styles.actionButtonText}>Empezar</Text>
            </TouchableOpacity>
          )}
          {order.status === 'EN PREPARACION' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#28a745' }]}
              onPress={() => updateOrderStatus(order.id, 'LISTO')}
            >
              <Text style={styles.actionButtonText}>Listo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.dashboardTitle}>Pedidos para Preparar</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchOrders}
      >
        <MaterialIcons name="refresh" size={24} color="#007bff" />
        <Text style={styles.refreshButtonText}>Actualizar</Text>
      </TouchableOpacity>
      
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="local-dining" size={50} color="#ccc" />
          <Text style={styles.emptyText}>¡No hay pedidos pendientes!</Text>
          <Text style={styles.emptyTextSmall}>Todo está al día.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default OrderListScreen;