import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
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

// Helper para mostrar fecha/hora en hora de Venezuela (America/Caracas)
const formatVenezuelaTime = (dateInput) => {
    try {
        const date = safeDate(dateInput);
        if (!date || isNaN(date.getTime())) return 'Fecha inválida';

        return new Intl.DateTimeFormat('es-VE', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    } catch (e) {
        return 'Error fecha';
    }
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

    // Rango de fechas por defecto: día actual
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [totalSales, setTotalSales] = useState(0);
    const [topProducts, setTopProducts] = useState([]); // Estado para Top Productos
    const isFocused = useIsFocused();
    const isFocusedRef = React.useRef(isFocused);
    const lastSocketFetchRef = React.useRef(0);

    useEffect(() => {
        isFocusedRef.current = isFocused;
    }, [isFocused]);

    const { userToken, API_BASE_URL, userName, userRole, socket } = useContext(AuthContext);

    // --- REF PARA EVITAR CIERRES STALE EN SOCKETS ---
    const fetchRef = React.useRef();
    useEffect(() => {
        fetchRef.current = fetchAllComandas;
    });

    // --- EFFECT: Sockets Globales (Reutilizando conexión de AuthContext) ---
    useEffect(() => {
        if (!socket) {
            console.log('⏳ Esperando al Socket Global en OrderAuditScreen...');
            return;
        }

        console.log('🔗 Suscribiendo listeners en OrderAuditScreen...');

        const updateListener = () => {
            if (!isFocusedRef.current) return;

            const now = Date.now();
            if (now - lastSocketFetchRef.current > 5000) { // Throttle de 5s para máxima estabilidad
                lastSocketFetchRef.current = now;
                if (fetchRef.current) fetchRef.current(true);
            }
        };

        // Escuchar cambios relevantes
        socket.on('comandaUpdated', updateListener);
        socket.on('comandaToKitchen', updateListener);
        socket.on('comandaToWaiter', updateListener);
        socket.on('comandaCanceladaToKitchen', updateListener);
        socket.on('comandaCanceladaToWaiter', updateListener);

        return () => {
            console.log('❌ Eliminando listeners en OrderAuditScreen');
            socket.off('comandaUpdated', updateListener);
            socket.off('comandaToKitchen', updateListener);
            socket.off('comandaToWaiter', updateListener);
            socket.off('comandaCanceladaToKitchen', updateListener);
            socket.off('comandaCanceladaToWaiter', updateListener);
        };
    }, [socket]);

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
    const fetchAllComandas = async (silent = false) => {
        const diffTime = Math.abs(new Date() - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 7;

        if (!silent) setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/comandas/?days=${diffDays}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setAllComandas(response.data);
        } catch (error) {
            console.error('Error al cargar comandas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto 1: carga inicial + focus
    useEffect(() => {
        let isMounted = true;

        const loadInit = async () => {
            if (isMounted) await fetchAllComandas(true);
        };

        loadInit();
        const unsubscribeFocus = navigation.addListener('focus', loadInit);

        return () => {
            isMounted = false;
            unsubscribeFocus();
        };
    }, [navigation, userToken, API_BASE_URL, startDate, endDate]);


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

        const rows = closedComandas.map(comanda => {
            const mesoneroName = comanda.usuario?.nombre_completo || comanda.nombre_mesonero || 'N/A';
            return `
            <tr>
                <td>${comanda.mesa}</td>
                <td>${mesoneroName}</td>
                <td style="text-align: right;">$${parseFloat(comanda.total_comanda).toFixed(2)}</td>
                <td>${formatVenezuelaTime(comanda.fecha_hora_comanda)}</td>
            </tr>
        `}).join('');

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
                            <td colspan="2">Total General de Ventas Cerradas:</td>
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
    // useEffect para FILTRADO y CÁLCULO
    useEffect(() => {
        filterAndCalculateTotals(allComandas, selectedStatus, startDate, endDate);
        // Deshabilitar warnings de dependencia si sabemos que filterAndCalculateTotals es seguro
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allComandas, selectedStatus, startDate, endDate, userName, userRole]);


    // --- LÓGICA DE DATE PICKER ---
    const showPicker = (setter) => {
        setCurrentDateSetter(() => setter);
        setPickerVisible(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setPickerVisible(false);
        if (event.type === 'set' && selectedDate) {
            // --- VALIDACIÓN DE FECHAS ---
            const isSettingStart = currentDateSetter === setStartDate;
            if (isSettingStart) {
                // La fecha inicio no puede ser mayor que la fecha fin
                if (selectedDate > endDate) {
                    Alert.alert('Fecha inválida', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
                    return;
                }
                setStartDate(selectedDate);
            } else {
                // La fecha fin no puede ser menor que la fecha inicio
                if (selectedDate < startDate) {
                    Alert.alert('Fecha inválida', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
                    return;
                }
                // La fecha fin no puede ser futura
                if (selectedDate > new Date()) {
                    Alert.alert('Fecha inválida', 'La fecha de fin no puede ser una fecha futura.');
                    return;
                }
                setEndDate(selectedDate);
            }
        }
    };

    const renderComanda = useCallback(({ item }) => (
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

            <Text style={appStyles.orderDetailText}>
                Mesa: {item.mesa} | Mesonero: {item.usuario?.nombre_completo || item.nombre_mesonero || 'N/A'}
            </Text>
            <Text style={[appStyles.orderDetailText, { marginBottom: 5 }]}>
                Fecha: {formatVenezuelaTime(item.fecha_hora_comanda)}
            </Text>

            {/* --- DETALLE DE PRODUCTOS --- */}
            <View style={appStyles.orderDetailList}>
                <Text style={[appStyles.summaryLabel, { fontSize: 13, marginBottom: 5, color: '#333' }]}>Productos ({(item.detallesComanda || []).length}):</Text>

                {(item.detallesComanda || []).slice(0, 2).map((detalle, index) => (
                    <Text key={index} style={appStyles.orderItemText}>
                        • {detalle?.cantidad || 0}x {detalle?.producto?.nombre_producto || 'Producto desconocido'}
                    </Text>
                ))}

                {(item.detallesComanda || []).length > 2 && (
                    <Text style={appStyles.orderItemText}>... y {(item.detallesComanda || []).length - 2} más</Text>
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

            {/* Motivo de Cancelación */}
            {item.motivo_cancelacion && (
                <View style={{ marginTop: 8, backgroundColor: '#fff3cd', borderRadius: 6, padding: 8, borderLeftWidth: 3, borderLeftColor: '#dc3545' }}>
                    <Text style={{ fontSize: 12, color: '#856404', fontWeight: 'bold' }}>⚠️ Motivo de cancelación:</Text>
                    <Text style={{ fontSize: 13, color: '#664d03', marginTop: 2 }}>{item.motivo_cancelacion}</Text>
                </View>
            )}
        </TouchableOpacity>
    ), [navigation, getStatusColor]); // Dependencia mínima para evitar recreación constante

    // --- RENDER HEADER FIJO (Evita crashes nativos del Picker al hacer scroll o renderizar) ---
    const renderHeader = () => (
        <View style={{ paddingBottom: 10 }}>
            <Text style={appStyles.dashboardTitle}>📋 Mis Comandas</Text>

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

            {/* Controles de Fecha - SIEMPRE VISIBLES */}
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

                {/* Renderizado condicional EXCLUSIVO para Android/iOS Picker para evitar Memory Leaks Nativos */}
                {isPickerVisible ? (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                ) : null}
            </View>

            {/* METRICA + PDF: Solo para comandas Cerradas */}
            {selectedStatus === 'Cerrada' && (
                <>
                    <View style={appStyles.summaryBox}>
                        <Text style={appStyles.summaryLabel}>
                            💵 Total Cerradas ({formatDate(startDate)} - {formatDate(endDate)}):
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
            {/* El Header FUERA del FlatList previene cierres súbitos por destrucción del Picker nativo */}
            {renderHeader()}

            <FlatList
                data={filteredComandas}
                keyExtractor={(item) => item.comanda_id.toString()}
                renderItem={renderComanda}
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
                // OPTIMIZACIONES EXTREMAS PARA ANDROID (Evitan cierres por memoria)
                removeClippedSubviews={true}
                initialNumToRender={4}
                maxToRenderPerBatch={2}
                windowSize={3}
                updateCellsBatchingPeriod={50}
            />
        </View>
    );
};
export default OrderAuditScreen;