import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

const OrderCreationScreen = ({ navigation }) => {
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // {productId: quantity}
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // **********************************************
  // LÓGICA DE DATOS
  // **********************************************
  const fetchProducts = async () => {
    try {
      // Endpoint: /api/v1/products
      const response = await axios.get(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos del menú.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCartChange = (productId, quantityChange) => {
    setCart(prevCart => {
      const currentQuantity = prevCart[productId] || 0;
      const newQuantity = currentQuantity + quantityChange;

      if (newQuantity <= 0) {
        // Eliminar del carrito si la cantidad es cero o menos
        const { [productId]: deleted, ...rest } = prevCart;
        return rest;
      }
      return { ...prevCart, [productId]: newQuantity };
    });
  };

  const getTotal = () => {
    return Object.keys(cart).reduce((total, productId) => {
      const product = products.find(p => p.id.toString() === productId);
      const quantity = cart[productId];
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  // **********************************************
  // LÓGICA DE CREACIÓN DE ORDEN
  // **********************************************
  const submitOrder = async () => {
    if (!tableNumber.trim()) {
      Alert.alert('Error', 'Debe especificar el número de mesa.');
      return;
    }
    if (Object.keys(cart).length === 0) {
      Alert.alert('Error', 'El carrito está vacío. Agregue productos para crear la orden.');
      return;
    }

    setIsSubmitting(true);

    // Formato de los ítems de la orden para la API
    const items = Object.keys(cart).map(productId => {
      const product = products.find(p => p.id.toString() === productId);
      return {
        productId: parseInt(productId),
        quantity: cart[productId],
        price: product.price, // Precio unitario actual
      };
    });

    const orderData = {
      tableNumber: tableNumber.trim(),
      items: items,
    };

    try {
      // Endpoint: /api/v1/orders
      await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      
      Alert.alert('Éxito', `Orden para la Mesa ${tableNumber} creada y enviada a cocina.`);
      
      // Limpiar y volver al dashboard
      setCart({});
      setTableNumber('');
      navigation.goBack(); 

    } catch (error) {
      console.error('Error al crear orden:', error);
      const message = error.response?.data?.message || 'Error al enviar la orden. Verifique la conexión.';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // **********************************************
  // COMPONENTES DE VISTA
  // **********************************************
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  const renderProduct = ({ item }) => {
    const quantity = cart[item.id.toString()] || 0;

    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDetails}>${item.price.toFixed(2)} | {item.category.replace('_', ' ')}</Text>
        </View>
        <View style={styles.cartControls}>
          <TouchableOpacity 
            style={[styles.cartButton, { backgroundColor: '#dc3545' }]}
            onPress={() => handleCartChange(item.id.toString(), -1)}
            disabled={quantity === 0}
          >
            <MaterialIcons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.cartQuantity}>{quantity}</Text>
          
          <TouchableOpacity 
            style={[styles.cartButton, { backgroundColor: '#28a745' }]}
            onPress={() => handleCartChange(item.id.toString(), 1)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.dashboardContainer}>
        <Text style={styles.dashboardTitle}>Toma de Pedidos</Text>

        {/* Campo Número de Mesa */}
        <Text style={styles.label}>Número de Mesa:</Text>
        <View style={styles.inputContainerForm}>
          <TextInput
            style={styles.inputForm}
            placeholder="Ej: 5"
            value={tableNumber}
            onChangeText={setTableNumber}
            keyboardType="numeric"
          />
        </View>

        {/* Lista de Productos */}
        <View style={styles.productListContainer}>
          <Text style={styles.orderItemsTitle}>Menú Disponible:</Text>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>

        {/* Resumen y Botón de Envío */}
        <View style={styles.orderSummary}>
          <Text style={styles.summaryText}>Total: ${getTotal().toFixed(2)}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#007bff' }]}
            onPress={submitOrder}
            disabled={isSubmitting || Object.keys(cart).length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialIcons name="send" size={24} color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 10 }]}>Enviar a Cocina</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OrderCreationScreen;