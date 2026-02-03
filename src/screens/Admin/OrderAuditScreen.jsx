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

// Helper para parsear fechas de forma segura en Android
const safeDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    // Si viene como string 'YYYY-MM-DD HH:mm:ss', reemplazar espacio por T
    if (typeof dateInput === 'string') {
        const iso = dateInput.replace(' ', 'T');
        return new Date(iso);
    }
    return new Date(dateInput);
};

// Helper para forzar hora Venezuela (UTC-4)
const formatVenezuelaTime = (dateInput) => {
    const date = safeDate(dateInput);
    // Construimos la fecha manualmente usando los componentes LOCALES
    // Esto respetará la hora que ya viene "lista" de la BD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

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

    // Rango de fechas por defecto: últimos 30 días
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());

    const [totalSales, setTotalSales] = useState(0);
    const [topProducts, setTopProducts] = useState([]); // Estado para Top Productos

    const { userToken, API_BASE_URL, userName, userRole } = useContext(AuthContext);

    // --- EFFECT: Calcular Top Productos ---
    useEffect(() => {
        if (!filteredComandas || filteredComandas.length === 0) {
            setTopProducts([]);
            return;
        }

        const productMap = {};

        // 1. Iterar solo sobre comandas CERRADAS dentro del filtro actual
        filteredComandas.forEach(comanda => {
            if (comanda.estado_comanda === 'Cerrada' && comanda.detallesComanda) {
                comanda.detallesComanda.forEach(detalle => {
                    const nombre = detalle.producto?.nombre_producto || 'Desconocido';
                    const cantidad = Number(detalle.cantidad) || 0;

                    if (!productMap[nombre]) {
                        productMap[nombre] = 0;
                    }
                    productMap[nombre] += cantidad;
                });
            }
        });

        // 2. Convertir a array y  ordenar
        const sortedProducts = Object.entries(productMap)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5); // Top 5

        setTopProducts(sortedProducts);

    }, [filteredComandas]);


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
        // Agregamos 1 día de buffer al final para evitar problemas de Timezones (UTC vs Local)
        const endOfDay = new Date(end).setHours(23, 59, 59, 999) + (24 * 60 * 60 * 1000);

        // 1. FILTRO DE MESONERO (Solo si NO es admin)
        // Obtenemos userRole del contexto (ya estaba disponible, solo hay que destructurarlo arriba)
        if (userName && userRole !== 'administrador') {
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

            const dateObj = safeDate(c.fecha_hora_comanda);
            if (!dateObj || isNaN(dateObj.getTime())) return true; // Si falla el parseo, la mostramos

            const comandaTimestamp = dateObj.getTime();
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
                <td>${formatVenezuelaTime(comanda.fecha_hora_comanda)}</td>
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
                Fecha: {formatVenezuelaTime(item.fecha_hora_comanda)}
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

            {/* Referencia de Pago */}
            {item.referencia_pago && (
                <Text style={{ marginTop: 4, color: '#666', fontStyle: 'italic', fontSize: 13 }}>
                    Referencia: <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.referencia_pago}</Text>
                </Text>
            )}
        </TouchableOpacity>
    );

    // --- RENDER HEADER (Todo lo que va arriba de la lista y debe scrollear) ---
    const renderHeader = () => (
        <View>
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

            {/* Controles de Fecha (Mismo renglón) */}
            {(selectedStatus === 'Cerrada' || selectedStatus === 'TODAS') && (
                <View style={[appStyles.dateFilterContainer, { marginBottom: 15 }]}>
                    <Text style={appStyles.summaryLabel}>Rango de Búsqueda:</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                        {/* Fecha Inicio */}
                        <TouchableOpacity onPress={() => showPicker(setStartDate)} style={[appStyles.dateButton, { flex: 1, marginRight: 5, marginBottom: 0 }]}>
                            <MaterialIcons name="event" size={20} color="#007bff" />
                            <Text style={appStyles.dateButtonText} numberOfLines={1}>
                                {formatDate(startDate)}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ marginHorizontal: 5, color: '#666' }}>al</Text>

                        <TouchableOpacity onPress={() => showPicker(setEndDate)} style={[appStyles.dateButton, { flex: 1, marginLeft: 5, marginBottom: 0 }]}>
                            <MaterialIcons name="event" size={20} color="#007bff" />
                            <Text style={appStyles.dateButtonText} numberOfLines={1}>
                                {formatDate(endDate)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isPickerVisible && (
                        <DateTimePicker
                            value={new Date()}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
                </View>
            )}

            {/* METRICA: Total de Ventas CERRADAS */}
            {(selectedStatus === 'Cerrada' || selectedStatus === 'TODAS') && (
                <>
                    {/* --- SECCIÓN PRODUCTOS MÁS VENDIDOS --- */}
                    <View style={{ marginBottom: 15, backgroundColor: '#fff', padding: 15, borderRadius: 8, elevation: 2 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>🏆 Productos Más Vendidos</Text>
                        {topProducts.length === 0 ? (
                            <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 12 }}>No hay suficientes datos.</Text>
                        ) : (
                            topProducts.map((prod, index) => (
                                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 4 }}>
                                    <Text style={{ flex: 1, color: '#444', fontSize: 13 }}>
                                        <Text style={{ fontWeight: 'bold' }}>#{index + 1}</Text> {prod.name}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', color: '#007bff', fontSize: 13 }}>{prod.qty}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={appStyles.summaryBox}>
                        <Text style={appStyles.summaryLabel}>
                            Total ({formatDate(startDate)} - {formatDate(endDate)}):
                        </Text>
                        <Text style={appStyles.summaryValue}>${totalSales.toFixed(2)}</Text>
                    </View>

                    {/* BOTÓN PARA GENERAR PDF */}
                    <TouchableOpacity
                        onPress={generateSalesPDF}
                        style={[appStyles.button, { marginTop: 5, marginBottom: 20, backgroundColor: '#dc3545', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }]}
                    >
                        <MaterialIcons name="picture-as-pdf" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={appStyles.buttonText}>Descargar Reporte</Text>
                    </TouchableOpacity>
                </>
            )}

            <Text style={[appStyles.label, { marginTop: 10, marginBottom: 5 }]}>Listado de Comandas:</Text>
        </View>
    );

    return (
        <View style={appStyles.dashboardContainer}>
            <FlatList
                data={filteredComandas}
                keyExtractor={(item) => item.comanda_id.toString()}
                renderItem={renderComanda}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={[appStyles.emptyState, { marginTop: 50 }]}>
                            <MaterialIcons name="local-dining" size={50} color="#ccc" />
                            <Text style={appStyles.emptyText}>
                                {userRole === 'administrador'
                                    ? `No hay comandas "${selectedStatus}" en este rango.`
                                    : `No hay comandas asignadas en estado "${selectedStatus}".`
                                }
                            </Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 20 }}
                style={{ flex: 1 }}
                // OPTIMIZACIONES DE MEMORIA
                removeClippedSubviews={true} // Desmonta vistas fuera de pantalla (Solo Android, pero ayuda mucho)
                initialNumToRender={10} // Renderiza solo 10 al inicio
                maxToRenderPerBatch={10} // Carga de 10 en 10
                windowSize={10} // Reduce el buffer de renderizado fuera de pantalla (Default es 21)
                getItemLayout={(data, index) => (
                    { length: 150, offset: 150 * index, index } // Asumiendo altura fija aprox de 150px
                )}
            />
        </View>
    );
};
export default OrderAuditScreen;