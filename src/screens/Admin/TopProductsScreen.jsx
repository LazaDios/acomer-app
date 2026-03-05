import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';

// Helper para parsear fechas de forma segura
const safeDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') return new Date(dateInput.replace(' ', 'T'));
    return new Date(dateInput);
};

const TopProductsScreen = () => {
    const { userToken, API_BASE_URL } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);
    const [topProducts, setTopProducts] = useState([]);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [currentDateSetter, setCurrentDateSetter] = useState(() => setStartDate);

    const fetchAndCalculate = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/comandas/`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const allComandas = response.data;

            const startOfDay = new Date(startDate).setHours(0, 0, 0, 0);
            const endOfDay = new Date(endDate).setHours(23, 59, 59, 999);

            // Filtrar solo comandas Cerradas en el rango de fechas
            const filtered = allComandas.filter(c => {
                if (c.estado_comanda !== 'Cerrada') return false;
                const dateObj = safeDate(c.fecha_hora_comanda);
                if (!dateObj || isNaN(dateObj.getTime())) return false;
                const ts = dateObj.getTime();
                return ts >= startOfDay && ts <= endOfDay;
            });

            // Calcular ranking
            const productMap = {};
            filtered.forEach(comanda => {
                (comanda.detallesComanda || []).forEach(detalle => {
                    const nombre = detalle.producto?.nombre_producto || 'Desconocido';
                    const cantidad = Number(detalle.cantidad) || 0;
                    productMap[nombre] = (productMap[nombre] || 0) + cantidad;
                });
            });

            const sorted = Object.entries(productMap)
                .map(([name, qty]) => ({ name, qty }))
                .sort((a, b) => b.qty - a.qty);

            setTopProducts(sorted);
        } catch (error) {
            console.error('Error al cargar top productos:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos.');
        } finally {
            setIsLoading(false);
        }
    }, [userToken, API_BASE_URL, startDate, endDate]);

    useEffect(() => {
        fetchAndCalculate();
    }, [fetchAndCalculate]);

    const showPicker = (setter) => {
        setCurrentDateSetter(() => setter);
        setPickerVisible(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setPickerVisible(false);
        if (event.type === 'set' && selectedDate) {
            const isSettingStart = currentDateSetter === setStartDate;
            if (isSettingStart) {
                if (selectedDate > endDate) {
                    Alert.alert('Fecha inválida', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
                    return;
                }
                setStartDate(selectedDate);
            } else {
                if (selectedDate < startDate) {
                    Alert.alert('Fecha inválida', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
                    return;
                }
                if (selectedDate > new Date()) {
                    Alert.alert('Fecha inválida', 'La fecha de fin no puede ser una fecha futura.');
                    return;
                }
                setEndDate(selectedDate);
            }
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    const renderItem = ({ item, index }) => (
        <View style={[styles.rankCard, index < 3 && { borderLeftColor: medalColors[index], borderLeftWidth: 5 }]}>
            <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.rankInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productQty}>{item.qty} unidades vendidas</Text>
            </View>
            {index < 3 && (
                <Text style={styles.medal}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Selector de rango de fechas */}
            <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => showPicker(setStartDate)}>
                    <MaterialIcons name="event" size={18} color="#007bff" />
                    <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
                <Text style={styles.dateSep}>→</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => showPicker(setEndDate)}>
                    <MaterialIcons name="event" size={18} color="#007bff" />
                    <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchBtn} onPress={fetchAndCalculate}>
                    <MaterialIcons name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {isPickerVisible && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                />
            )}

            {isLoading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 40 }} />
            ) : topProducts.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialIcons name="bar-chart" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Sin datos en este rango de fechas.</Text>
                    <Text style={styles.emptySubtext}>Solo se contabilizan comandas en estado "Cerrada".</Text>
                </View>
            ) : (
                <FlatList
                    data={topProducts}
                    keyExtractor={(item, index) => `${item.name}-${index}`}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <Text style={styles.subtitle}>
                            🏆 {topProducts.length} productos · {formatDate(startDate)} - {formatDate(endDate)}
                        </Text>
                    }
                    contentContainerStyle={{ paddingBottom: 30 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
    dateRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12, padding: 10,
        marginBottom: 16, elevation: 2, gap: 6,
    },
    dateBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#eef4ff', borderRadius: 8, padding: 8, gap: 4,
    },
    dateBtnText: { fontSize: 13, color: '#333', flex: 1 },
    dateSep: { color: '#999', fontSize: 16, marginHorizontal: 2 },
    searchBtn: {
        backgroundColor: '#007bff', borderRadius: 8, padding: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    subtitle: {
        fontSize: 13, color: '#666', marginBottom: 12,
        fontStyle: 'italic', textAlign: 'center',
    },
    rankCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12,
        padding: 14, marginBottom: 10, elevation: 2,
        borderLeftColor: '#eee', borderLeftWidth: 4,
    },
    rankBadge: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#007bff', alignItems: 'center',
        justifyContent: 'center', marginRight: 12,
    },
    rankNumber: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    rankInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
    productQty: { fontSize: 13, color: '#666', marginTop: 2 },
    medal: { fontSize: 24, marginLeft: 8 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#666', marginTop: 12, fontWeight: '600' },
    emptySubtext: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});

export default TopProductsScreen;
