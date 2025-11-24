import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles as appStyles } from '../../styles/AppStyles'; // Usamos un alias para los estilos globales
import DateTimePicker from '@react-native-community/datetimepicker'; 

// Importaciones para la generación y compartición de PDF (requiere instalación en tu proyecto Expo)
import * as Print from 'expo-print'; 
import * as Sharing from 'expo-sharing';

// Estados sincronizados con la capitalización del backend
const COMANDA_STATES = ['TODAS', 'Abierta', 'Preparando', 'Finalizada', 'Cerrada', 'Cancelada'];

const OrderAuditScreen = ({ navigation }) => {

    const [isPickerVisible, setPickerVisible] = useState(false);
    const [currentDateSetter, setCurrentDateSetter] = useState(() => setStartDate);

    const [allComandas, setAllComandas] = useState([]);
    const [filteredComandas, setFilteredComandas] = useState([]);
    
    // Lo usamos solo para saber si la primera carga terminó
    const [isLoading, setIsLoading] = useState(true); 
    
    const [selectedStatus, setSelectedStatus] = useState('TODAS'); 

    // Rango de fechas por defecto: última semana
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); 
    const [endDate, setEndDate] = useState(new Date()); 
    
    const [totalSales, setTotalSales] = useState(0);

    const { userToken, API_BASE_URL, userName } = useContext(AuthContext);

    // --- FUNCIÓN DE CARGA DE DATOS ---
    const fetchAllComandas = async () => {
        // NO se llama setIsLoading(true) para que el polling sea silencioso
        try {
            const response = await axios.get(`${API_BASE_URL}/comandas/`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setAllComandas(response.data);
        } catch (error) {
            console.error('Error al cargar comandas:', error);
        } finally {
            // Solo para la primera carga, se pasa a false, permitiendo el renderizado principal
            if (isLoading) setIsLoading(false); 
        }
    };
    
    // --- LÓGICA DE FILTRADO Y CÁLCULO ---
    const filterAndCalculateTotals = (comandas, status, start, end) => {
        let salesTotal = 0;
        let filtered = comandas;
        
        const startOfDay = new Date(start).setHours(0, 0, 0, 0);
        const endOfDay = new Date(end).setHours(23, 59, 59, 999);
        
        // 1. FILTRO DE MESONERO
        if (userName) {
            filtered = filtered.filter(comanda => comanda.nombre_mesonero === userName);
        }
        
        // 2. FILTRO DE ESTADO
        if (status !== 'TODAS') {
            filtered = filtered.filter(comanda => comanda.estado_comanda === status); 
        }

        // 3. FILTRO DE FECHA (Para visualizar el listado)
        filtered = filtered.filter(c => {
             // Si no hay fecha, asumimos que debe mostrarse (opcional: podrías descartarla)
             if (!c.fecha_hora_comanda) return true; 
             
             const comandaTimestamp = new Date(c.fecha_hora_comanda).getTime();
             return comandaTimestamp >= startOfDay && comandaTimestamp <= endOfDay;
        });

        // 4. CÁLCULO DE VENTAS (Solo comandas 'Cerrada' en el rango de fechas)
        if (status === 'Cerrada' || status === 'TODAS') {
            salesTotal = filtered
                .filter(c => c.estado_comanda === 'Cerrada')
                .reduce((sum, comanda) => sum + (parseFloat(comanda.total_comanda) || 0), 0);
        } 
        
        setFilteredComandas(filtered);
        setTotalSales(salesTotal);
    };

    // --- FUNCIONES DE NAVEGACIÓN Y FORMATO ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'Cerrada': return '#6f42c1'; 
            case 'Finalizada': return '#28a745'; 
            case 'Abierta': return '#ffc107';   
            case 'Preparando': return '#007bff'; 
            case 'Cancelada': return '#dc3545';  
            default: return '#6c757d';
        }
    };
    
    const formatDate = (date) => new Date(date).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const handleViewDetails = (comandaId) => {
        // Usamos 'OrderDetails' que es el nombre registrado en AdminNavigator.js
        navigation.navigate('OrderDetails', { comandaId: comandaId }); 
    };
    
    // --- LÓGICA DE GENERACIÓN DE PDF ---
    const createHtmlContent = (comandas, total, start, end) => {
        const formatDateLong = (date) => new Date(date).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const startDateFormatted = formatDateLong(start);
        const endDateFormatted = formatDateLong(end);
        
        const closedComandas = comandas.filter(c => c.estado_comanda === 'Cerrada');

        const rows = closedComandas.map(comanda => `
            <tr>
                <td>#${comanda.comanda_id}</td>
                <td>${comanda.mesa}</td>
                <td>${comanda.nombre_mesonero || 'N/A'}</td>
                <td style="text-align: right;">$${parseFloat(comanda.total_comanda).toFixed(2)}</td>
                <td>${new Date(comanda.fecha_hora_comanda).toLocaleString('es-ES')}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reporte de Ventas</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #007bff; text-align: center; }
                    .header { margin-bottom: 20px; text-align: center; }
                    .summary { background-color: #d4edda; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
                    .summary h2 { color: #155724; margin: 0; font-size: 24px; }
                    .summary p { font-size: 14px; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                    th { background-color: #f2f2f2; }
                    .total-row td { font-weight: bold; background-color: #e9ecef; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPORTE DE VENTAS DE COMANDAS CERRADAS</h1>
                    <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
                </div>

                <div class="summary">
                    <p>Rango de Fechas: ${startDateFormatted} al ${endDateFormatted}</p>
                    <h2>TOTAL GENERADO: $${total.toFixed(2)}</h2>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mesa</th>
                            <th>Mesonero</th>
                            <th style="text-align: right;">Total Comanda</th>
                            <th>Fecha/Hora Cierre</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3">Total General de Ventas Cerradas:</td>
                            <td style="text-align: right;">$${total.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;
    };

    const generateSalesPDF = async () => {
        if (totalSales <= 0) {
            Alert.alert('Advertencia', 'No hay ventas cerradas para generar el reporte en este rango de fechas. Asegúrese de tener comandas en estado "Cerrada" y que el total sea mayor a cero.');
            return;
        }

        const htmlContent = createHtmlContent(filteredComandas, totalSales, startDate, endDate);
        
        try {
            // Generar PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            // Compartir el PDF
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir Reporte de Ventas' });
            
            Alert.alert('Éxito', 'El reporte PDF ha sido generado y está listo para compartir.');
            
        } catch (error) {
            console.error('Error al generar o compartir el PDF:', error);
            Alert.alert('Error', 'Hubo un problema al generar el archivo PDF. Verifique su instalación de Expo Print/Sharing.');
        }
    };
    
    // --- LÓGICA DE USE EFFECT ---
    useEffect(() => {
        const loadData = () => fetchAllComandas();
        loadData();

        const unsubscribeFocus = navigation.addListener('focus', loadData);

        // Polling (Actualización automática, silenciosa)
        const intervalId = setInterval(() => {
            console.log('Actualizando comandas automáticamente...');
            loadData();
        }, 10000); // 10 segundos

        // Función de limpieza
        return () => {
            unsubscribeFocus();
            clearInterval(intervalId);
        };
    }, [navigation, userToken, API_BASE_URL]);

    // useEffect para FILTRADO y CÁLCULO
    useEffect(() => {
        if (allComandas.length === 0 && !isLoading) {
            setFilteredComandas([]);
            setTotalSales(0);
            return;
        }
        filterAndCalculateTotals(allComandas, selectedStatus, startDate, endDate);
    }, [allComandas, selectedStatus, startDate, endDate, userName]); 

    
    // --- LÓGICA DE DATE PICKER ---
    const showPicker = (setter) => {
        setCurrentDateSetter(() => setter); 
        setPickerVisible(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setPickerVisible(false); 
        if (event.type === 'set' && selectedDate) {
            currentDateSetter(selectedDate); 
        }
    };

    const renderComanda = ({ item }) => (
        <TouchableOpacity 
            style={appStyles.orderCard} 
            onPress={() => handleViewDetails(item.comanda_id)} 
        >
            <View style={appStyles.orderHeader}>
                <Text style={appStyles.orderTitle}>Comanda #{item.comanda_id}</Text>
                <View style={[
                    appStyles.orderStatusPill, 
                    { backgroundColor: getStatusColor(item.estado_comanda) } 
                ]}>
                    <Text style={appStyles.orderStatusText}>
                        {item.estado_comanda || 'SIN ESTADO'}
                    </Text>
                </View>
            </View>
            
            <Text style={appStyles.orderDetailText}>Mesa: {item.mesa} | Mesonero: {item.nombre_mesonero || 'N/A'}</Text>
            <Text style={[appStyles.orderDetailText, { marginBottom: 5 }]}>
                Fecha: {item.fecha_hora_comanda ? new Date(item.fecha_hora_comanda).toLocaleString() : 'N/A'}
            </Text>
            
            {/* --- DETALLE DE PRODUCTOS --- */}
            <View style={appStyles.orderDetailList}>
                <Text style={[appStyles.summaryLabel, { fontSize: 13, marginBottom: 5, color: '#333' }]}>Productos ({item.detallesComanda?.length || 0}):</Text>
                
                {item.detallesComanda?.slice(0, 2).map((detalle, index) => ( // Solo muestra los primeros 2
                    <Text key={index} style={appStyles.orderItemText}>
                        • {detalle.cantidad}x {detalle.producto.nombre_producto} 
                    </Text>
                ))}
                
                {item.detallesComanda?.length > 2 && (
                    <Text style={appStyles.orderItemText}>... y {item.detallesComanda.length - 2} más</Text>
                )}
            </View>

            <Text style={[appStyles.orderDetailText, { fontWeight: 'bold', marginTop: 10, fontSize: 16 }]}>
                Total: ${parseFloat(item.total_comanda || 0).toFixed(2)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={appStyles.dashboardContainer}>
            
            <Text style={appStyles.dashboardTitle}>📋 Mis Comandas (Mesonero)</Text>
            
            {/* Pequeño indicador para la primera carga si la lista está vacía */}
            {isLoading && filteredComandas.length === 0 && (
                <View style={{ paddingVertical: 10 }}>
                    <ActivityIndicator size="small" color="#007bff" />
                </View>
            )}

            {/* Selector de Estado */}
            <Text style={appStyles.label}>Filtrar por Estado:</Text>
            <View style={appStyles.pickerContainer}>
                <Picker
                    selectedValue={selectedStatus}
                    onValueChange={(itemValue) => setSelectedStatus(itemValue)}
                    style={appStyles.picker}
                >
                    {COMANDA_STATES.map((state) => (
                        <Picker.Item key={state} label={state} value={state} />
                    ))}
                </Picker>
            </View>
            
            {/* Controles de Fecha */}
            {(selectedStatus === 'Cerrada' || selectedStatus === 'TODAS') && (
                <View style={appStyles.dateFilterContainer}>
                    <Text style={appStyles.summaryLabel}>Rango de Búsqueda:</Text>
                    
                    <View style={appStyles.datePickerRow}>
                        {/* Fecha Inicio */}
                        <TouchableOpacity onPress={() => showPicker(setStartDate)} style={appStyles.dateButton}>
                            <MaterialIcons name="event" size={20} color="#007bff" />
                            <Text style={appStyles.dateButtonText}>Desde: {formatDate(startDate)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => showPicker(setEndDate)} style={appStyles.dateButton}>
                            <MaterialIcons name="event" size={20} color="#007bff" />
                            <Text style={appStyles.dateButtonText}>Hasta: {formatDate(endDate)}</Text>
                        </TouchableOpacity>

                        {isPickerVisible && (
                            <DateTimePicker
                                value={new Date()}
                                mode="date" 
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>
                </View>
            )}

            {/* METRICA: Total de Ventas CERRADAS */}
            {(selectedStatus === 'Cerrada' || selectedStatus === 'TODAS') && (
                <>
                    {/* BOTÓN PARA GENERAR PDF */}
                    <TouchableOpacity 
                        onPress={generateSalesPDF} 
                        style={[appStyles.button, { marginTop: 10, backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                    >
                        <MaterialIcons name="picture-as-pdf" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={appStyles.buttonText}>Generar Reporte PDF (${totalSales.toFixed(2)})</Text>
                    </TouchableOpacity>

                    <View style={appStyles.summaryBox}>
                        <Text style={appStyles.summaryLabel}>
                            Total de Ventas CERRADAS en el rango ({formatDate(startDate)} - {formatDate(endDate)}):
                        </Text>
                        <Text style={appStyles.summaryValue}>${totalSales.toFixed(2)}</Text>
                    </View>
                </>
            )}

            {/* Lista de Comandas Filtradas */}
            {filteredComandas.length === 0 && !isLoading ? ( 
                <View style={appStyles.emptyState}>
                    <MaterialIcons name="local-dining" size={50} color="#ccc" />
                    <Text style={appStyles.emptyText}>No hay comandas en estado "{selectedStatus}" en el rango seleccionado o para su usuario.</Text>
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