import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

// NOTA: Se ha eliminado la dependencia y uso de 'Picker' y 'PRODUCT_CATEGORIES'
// ya que la tabla de productos no gestiona la categoría.

// **************************************************
// 1. FORMULARIO DE PRODUCTOS (Crear y Editar)
// **************************************************
export const ProductFormScreen = ({ navigation, route }) => {
  const productToEdit = route.params?.productToEdit; 
  
  // Usamos los campos de la BD: nombre_producto y precio_producto
  const [nombre, setNombre] = useState(productToEdit?.nombre_producto || '');
  const [precio, setPrecio] = useState(productToEdit?.precio_producto?.toString() || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userToken, API_BASE_URL } = useContext(AuthContext);

  useEffect(() => {
    navigation.setOptions({
      title: productToEdit ? 'Editar Producto' : 'Crear Producto',
    });
  }, [productToEdit]);

  const submitProduct = async () => {
    if (!nombre || !precio) {
      Alert.alert('Error', 'Nombre y precio son obligatorios.');
      return;
    }

    const parsedPrecio = parseFloat(precio);
    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
      Alert.alert('Error', 'El precio debe ser un número positivo.');
      return;
    }

    setIsSubmitting(true);
    
    // OBJETO DE DATOS SINCRONIZADO SOLO CON LA BD (nombre_producto, precio_producto)
    const data = { 
      nombre_producto: nombre, 
      precio_producto: parsedPrecio, 
      // Se eliminan category y description
    };

    try {
      if (productToEdit) {
        // PATCH /productos/:id_producto
        await axios.patch(`${API_BASE_URL}/productos/${productToEdit.id_producto}`, data, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        Alert.alert('Éxito', `Producto '${nombre}' actualizado.`);
      } else {
        // POST /productos
        await axios.post(`${API_BASE_URL}/productos`, data, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        Alert.alert('Éxito', `Producto '${nombre}' creado correctamente.`);
      }
      
      navigation.goBack(); 

    } catch (error) {
      console.error('Error al guardar producto:', error);
      const message = error.response?.data?.message || 'Error de conexión o datos inválidos.';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      {/* Campo de Nombre */}
      <Text style={styles.label}>Nombre del Producto:</Text>
      <View style={styles.inputContainerForm}>
        <TextInput
          style={styles.inputForm}
          value={nombre}
          onChangeText={setNombre}
        />
      </View>

      {/* Campo de Precio */}
      <Text style={styles.label}>Precio ($):</Text>
      <View style={styles.inputContainerForm}>
        <TextInput
          style={styles.inputForm}
          value={precio}
          onChangeText={setPrecio}
          keyboardType="numeric"
        />
      </View>
      
      {/* SE HAN ELIMINADO LOS CAMPOS DE CATEGORÍA Y DESCRIPCIÓN */}

      <TouchableOpacity 
        style={styles.button} 
        onPress={submitProduct}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// **************************************************
// 2. LISTA DE PRODUCTOS (CRUD READ)
// **************************************************
export const ProductManagementScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken, API_BASE_URL } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchProducts);
    return unsubscribe;
  }, [navigation]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/productos`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setProducts(response.data); 
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId, productName) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que quieres eliminar el producto "${productName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/productos/${productId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
              });
              Alert.alert('Éxito', 'Producto eliminado.');
              fetchProducts(); 
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto. Revisar permisos de API.');
            }
          }
        },
      ]
    );
  };
  
  const renderProduct = ({ item }) => {
    const price = parseFloat(item.precio_producto) || 0; 
    
    return (
      <View style={styles.productAuditCard}> 
        <View style={styles.productAuditInfo}>
          <Text style={styles.productName}>{item.nombre_producto}</Text> 
          <Text style={styles.productDetails}>${price.toFixed(2)}</Text> 
          {/* SE HA ELIMINADO LA LECTURA DE CATEGORY */}
        </View>
        <View style={styles.productAuditActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#007bff' }]}
            onPress={() => navigation.navigate('ProductForm', { productToEdit: item })}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#dc3545', marginLeft: 10 }]}
            onPress={() => deleteProduct(item.id_producto, item.nombre_producto)}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando gestión de productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.dashboardContainer}>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#28a745' }]} 
        onPress={() => navigation.navigate('ProductForm', { productToEdit: null })}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={[styles.buttonText, { marginLeft: 10 }]}>Añadir Nuevo Producto</Text>
      </TouchableOpacity>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
            <MaterialIcons name="inventory-2" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay productos en el menú.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id_producto.toString()} 
          renderItem={renderProduct}
          contentContainerStyle={{ paddingBottom: 20, marginTop: 15 }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
};
