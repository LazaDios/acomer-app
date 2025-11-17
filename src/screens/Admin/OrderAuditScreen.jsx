import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';
import DateTimePicker from '@react-native-community/datetimepicker';

// Estados sincronizados con el enum de NestJS
const COMANDA_STATES = ['ABIERTA', 'PREPARANDO', 'FINALIZADA', 'CERRADA', 'CANCELADA'];

const OrderAuditScreen = ({ navigation }) => {

    const [isPickerVisible, setPickerVisible] = useState(false);
const [currentDateSetter, setCurrentDateSetter] = useState(() => setStartDate);


  const [allComandas, setAllComandas] = useState([]);
  const [filteredComandas, setFilteredComandas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para el filtro de estatus
  const [selectedStatus, setSelectedStatus] = useState('CERRADA'); 

  // Estados para el filtro de rango de fechas
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Por defecto: Hace 7 días
  const [endDate, setEndDate] = useState(new Date()); // Por defecto: Hoy
  
  const [totalSales, setTotalSales] = useState(0);

  const { userToken, API_BASE_URL } = useContext(AuthContext);

  // Se ejecuta al cargar la pantalla y cuando los filtros cambian
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllComandas();
    });
    return unsubscribe;
  }, [navigation]);

  // Vuelve a filtrar y calcular cuando las comandas o los filtros cambian
  useEffect(() => {
    filterAndCalculateTotals(allComandas, selectedStatus, startDate, endDate);
  }, [allComandas, selectedStatus, startDate, endDate]);


  const fetchAllComandas = async () => {
    setIsLoading(true);
    try {
      // Endpoint esperado: GET /comandas (retorna todas las comandas)
      const response = await axios.get(`${API_BASE_URL}/comandas`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setAllComandas(response.data);
    } catch (error) {
      console.error('Error al cargar comandas:', error);
      Alert.alert('Error', 'No se pudieron cargar las comandas para auditoría.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterAndCalculateTotals = (comandas, status, start, end) => {
    let salesTotal = 0;
    let filtered = [];
    
    // Prepara las fechas para el filtro de rango (start a las 00:00:00, end a las 23:59:59)
    const startOfDay = new Date(start).setHours(0, 0, 0, 0);
    const endOfDay = new Date(end).setHours(23, 59, 59, 999);
    
    // Si el estado seleccionado es 'CERRADA', aplicamos el filtro de fecha y calculamos el total
    if (status === 'CERRADA') {
      filtered = comandas
        .filter(c => c.estado_comanda === 'CERRADA')
        .filter(c => {
            if (!c.fecha_hora_comanda) return false;
            
            const comandaTimestamp = new Date(c.fecha_hora_comanda).getTime();
            return comandaTimestamp >= startOfDay && comandaTimestamp <= endOfDay;
        });
            
      salesTotal = filtered
        .reduce((sum, comanda) => sum + (parseFloat(comanda.total_comanda) || 0), 0);
        
    } else {
        // Para otros estados, solo filtramos por estado sin aplicar rango de fecha
        filtered = comandas.filter(comanda => comanda.estado_comanda === status);
    }
    
    setFilteredComandas(filtered);
    setTotalSales(salesTotal);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CERRADA': return '#6f42c1'; 
      case 'FINALIZADA': return '#28a745'; 
      case 'ABIERTA': return '#ffc107';   
      case 'PREPARANDO': return '#007bff'; 
      case 'CANCELADA': return '#dc3545';  
      default: return '#6c757d';
    }
  };
  
  const formatDate = (date) => date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

 // Función que MUESTRA el selector
const showPicker = (setter) => {
    setCurrentDateSetter(() => setter); // Guarda qué función usar (setStartDate o setEndDate)
    setPickerVisible(true);
};

// Función que MANEJA el cambio de fecha
const handleDateChange = (event, selectedDate) => {
    setPickerVisible(false); // Oculta el selector
    if (event.type === 'set' && selectedDate) {
        currentDateSetter(selectedDate); // Aplica la fecha a setStartDate o setEndDate
    }
};

  const renderComanda = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>Comanda #{item.comanda_id}</Text>
        <View style={[
            styles.orderStatusPill, 
            { backgroundColor: getStatusColor(item.estado_comanda) } 
        ]}>
            <Text style={styles.orderStatusText}>
                {item.estado_comanda?.replace(/_/g, ' ') || 'SIN ESTADO'}
            </Text>
        </View>
      </View>
      
      <Text style={styles.orderDetailText}>Mesa: {item.mesa}</Text>
      <Text style={styles.orderDetailText}>Mesonero: {item.nombre_mesonero || 'N/A'}</Text>
      <Text style={[styles.orderDetailText, { fontWeight: 'bold', marginTop: 5 }]}>
          Total: ${parseFloat(item.total_comanda || 0).toFixed(2)}
      </Text>
      <Text style={styles.orderDetailText}>
          Fecha: {item.fecha_hora_comanda ? new Date(item.fecha_hora_comanda).toLocaleString() : 'N/A'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.dashboardContainer}>
      
      <Text style={styles.dashboardTitle}>📊 Auditoría de Comandas</Text>

      {/* Selector de Estado */}
      <Text style={styles.label}>Filtrar por Estado:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedStatus}
          onValueChange={(itemValue) => setSelectedStatus(itemValue)}
          style={styles.picker}
        >
          {COMANDA_STATES.map((state) => (
            <Picker.Item key={state} label={state.replace(/_/g, ' ')} value={state} />
          ))}
        </Picker>
      </View>
      
      {/* Controles de Fecha (Solo visible si el estado es CERRADA) */}
      {selectedStatus === 'CERRADA' && (
        <View style={styles.dateFilterContainer}>
            <Text style={styles.summaryLabel}>Rango de Auditoría:</Text>
            
            <View style={styles.datePickerRow}>
                {/* Fecha Inicio */}
                <TouchableOpacity onPress={() => showPicker(setStartDate)} style={styles.dateButton}>
                    <MaterialIcons name="event" size={20} color="#007bff" />
                    <Text style={styles.dateButtonText}>Desde: {formatDate(startDate)}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => showPicker(setEndDate)} style={styles.dateButton}>
                    <MaterialIcons name="event" size={20} color="#007bff" />
                    <Text style={styles.dateButtonText}>Hasta: {formatDate(endDate)}</Text>
                </TouchableOpacity>

{isPickerVisible && (
            <DateTimePicker
                value={new Date()} // Siempre inicializa con una fecha (o la fecha actual del estado que se está editando)
                mode="date" // Modo solo fecha
                display="default"
                onChange={handleDateChange}
            />
        )}



                </View>
                </View>
      )}

      {/* METRICA: Total de Ventas CERRADAS */}
      {selectedStatus === 'CERRADA' && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>
            Total de Ventas CERRADAS ({formatDate(startDate)} - {formatDate(endDate)}):
          </Text>
          <Text style={styles.summaryValue}>${totalSales.toFixed(2)}</Text>
        </View>
      )}

      {/* Lista de Comandas Filtradas */}
      {filteredComandas.length === 0 ? (
        <View style={styles.emptyState}>
            <MaterialIcons name="local-dining" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay comandas en estado "{selectedStatus.replace(/_/g, ' ')}" en el rango seleccionado.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComandas}
          keyExtractor={(item) => item.comanda_id.toString()}
          renderItem={renderComanda}
          contentContainerStyle={{ paddingBottom: 20, marginTop: 15 }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
};
export default OrderAuditScreen;