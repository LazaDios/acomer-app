import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardBase from '../../components/DashboardBase';
import { styles } from '../../styles/AppStyles';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

// Pantalla Principal del Administrador
const AdminMainScreen = ({ navigation }) => {
  const { API_BASE_URL, userToken, restaurant } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [tasaCambio, setTasaCambio] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar tasa actual al abrir
  const fetchTasa = async () => {
    if (!restaurant?.id_restaurante) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/restaurantes/${restaurant.id_restaurante}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (response.data.tasa_cambio) {
        setTasaCambio(response.data.tasa_cambio.toString());
      }
    } catch (error) {
      console.error("Error fetching rate:", error);
    }
  };

  useEffect(() => {
    fetchTasa();
  }, [restaurant]);

  const handleUpdateTasa = async () => {
    if (!tasaCambio || isNaN(parseFloat(tasaCambio))) {
      Alert.alert("Error", "Ingrese un monto válido.");
      return;
    }
    setLoading(true);
    try {
      // PATCH /restaurantes/:id
      await axios.patch(`${API_BASE_URL}/restaurantes/${restaurant.id_restaurante}`, {
        tasa_cambio: parseFloat(tasaCambio)
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      Alert.alert("Éxito", "Tasa de cambio actualizada correctamente.");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating rate:", error);
      Alert.alert("Error", "No se pudo actualizar la tasa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Usamos DashboardBase, asumiendo que ya tiene flex: 1 y SafeAreaView
    <DashboardBase>
      {/* Contenedor con padding para el margen de toda la pantalla */}
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>

        {/* Título */}
        <Text style={styles.dashboardTitle}>Panel de Administración</Text>
        <Text style={styles.infoText}>Opciones Rápidas:</Text>

        {/* 4. Botón CONFIGURAR TASA (NUEVO) */}
        <TouchableOpacity
          style={[styles.dashboardButton, styles.adminButtonBase, { backgroundColor: '#6f42c1' }]}
          onPress={() => { fetchTasa(); setModalVisible(true); }}
        >
          <MaterialIcons name="attach-money" size={24} color="#fff" />
          <Text style={styles.dashboardButtonText}>Configurar Tasa (BS)</Text>
        </TouchableOpacity>

        {/* 1. Botón para la creación de usuarios */}
        <TouchableOpacity
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
          style={[styles.dashboardButton, styles.adminButtonBase, { backgroundColor: '#ffc107' }]}
          onPress={() => navigation.navigate('OrderAudit')}
        >
          <MaterialIcons name="receipt-long" size={24} color="#333" />
          <Text style={[styles.dashboardButtonText, { color: '#333' }]}>Auditoría de Comandas</Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { marginTop: 20 }]}>Gestión general del restaurante.</Text>

        {/* MODAL PARA TASA DE CAMBIO */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={localStyles.modalCenteredView}>
            <View style={localStyles.modalView}>
              <Text style={localStyles.modalTitle}>Configurar Tasa BS/$</Text>
              <Text>Ingrese el valor actual del Dólar:</Text>

              <TextInput
                style={localStyles.input}
                value={tasaCambio}
                onChangeText={setTasaCambio}
                keyboardType="numeric"
                placeholder="Ej. 60.50"
              />

              <View style={localStyles.modalButtons}>
                <TouchableOpacity
                  style={[localStyles.button, { backgroundColor: '#dc3545' }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={localStyles.textStyle}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[localStyles.button, { backgroundColor: '#28a745' }]}
                  onPress={handleUpdateTasa}
                  disabled={loading}
                >
                  <Text style={localStyles.textStyle}>{loading ? 'Guardando...' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </DashboardBase>
  );
};

const localStyles = StyleSheet.create({
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    width: '80%',
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 15,
    fontSize: 18,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '45%'
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default AdminMainScreen;