import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation as _unused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

// Estados Sincronizados
const ESTADO_PREPARANDO = 'Preparando'; // Nota: Usamos la capitalización de la API
const ESTADO_FINALIZADA = 'Finalizada';
const ESTADO_ABIERTA = 'Abierta';
const ESTADO_CANCELADA = 'Cancelada'; // El cocinero debe verlas para referencia

export const CocineroDashboard = ({ navigation }) => {
    const { userToken, API_BASE_URL, logout, userData } = useContext(AuthContext);

    const [comandas, setComandas] = useState([]);
    const [isListLoading, setIsListLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const getPriority = (status) => {
        // PRIORIDAD DEL COCINERO: 
        // 1. ABIERTA (Nueva y lista para empezar)
        // 2. PREPARANDO (En progreso)
        // 3. CANCELADA (Al final)
        switch (status) {
            case ESTADO_ABIERTA: return 1;
            case ESTADO_PREPARANDO: return 2;
            case ESTADO_CANCELADA: return 3;
            default: return 4;
        }
    };

    const fetchCocineroComandas = useCallback(async (silent = false) => {
        if (!silent) setIsListLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/detalle-comandas/cocinero/pendientes`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            let fetchedComandas = response.data;

            fetchedComandas.sort((a, b) => {
                const priorityA = getPriority(a.estado_comanda);
                const priorityB = getPriority(b.estado_comanda);
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(a.fecha_hora_comanda).getTime() - new Date(b.fecha_hora_comanda).getTime();
            });

            setComandas(fetchedComandas.filter(c => c.estado_comanda !== ESTADO_FINALIZADA));

        } catch (error) {
            console.error('Error al cargar comandas:', error.response?.data || error.message);
        } finally {
            if (!silent) setIsListLoading(false);
        }
    }, [userToken, API_BASE_URL]);


    // Efecto 1: Carga inicial + focus
    useEffect(() => {
        fetchCocineroComandas();
        const unsubscribeFocus = navigation.addListener('focus', fetchCocineroComandas);
        return () => unsubscribeFocus();
    }, [fetchCocineroComandas, navigation]);

    // Efecto 2: WebSocket estable
    useEffect(() => {
        const socketUrl = API_BASE_URL.replace('/api/v1', '');
        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => console.log('✅ WS conectado en CocineroDashboard'));
        socket.on('comandaUpdated', () => fetchCocineroComandas(true));
        socket.on('comandaToKitchen', () => fetchCocineroComandas(true));
        socket.on('comandaCanceladaToKitchen', () => fetchCocineroComandas(true));
        socket.on('connect_error', (err) => console.warn('⚠️ WS error Cocinero:', err.message));

        return () => {
            socket.disconnect();
            console.log('🔌 WS desconectado en CocineroDashboard');
        };
    }, [API_BASE_URL]);


    // Función para cambiar el estado de la comanda
    const updateComandaStatus = async (comandaId, nuevoEstado, successMessage, errorMessage) => {
        setIsUpdating(true);
        try {
            // Usamos el mismo endpoint de PATCH que el Mesonero
            await axios.patch(`${API_BASE_URL}/comandas/${comandaId}/status`, {
                estado: nuevoEstado,
            }, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            Alert.alert('Éxito', successMessage);
            fetchCocineroComandas();
        } catch (error) {
            console.error(errorMessage, error.response?.data || error.message);
            Alert.alert('Error', errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };


    // Acciones del Cocinero:
    const handleStartPreparation = (comandaId) => {
        updateComandaStatus(
            comandaId,
            ESTADO_PREPARANDO,
            `Comanda #${comandaId}: Preparación INICIADA.`,
            'No se pudo iniciar la preparación.'
        );
    };

    const handleMarkReady = (comandaId) => {
        updateComandaStatus(
            comandaId,
            ESTADO_FINALIZADA,
            `Comanda #${comandaId}: ¡LISTA para ser despachada!`,
            'No se pudo marcar como lista.'
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case ESTADO_ABIERTA: return '#dc3545';      // Rojo (Nuevo pedido urgente)
            case ESTADO_PREPARANDO: return '#ffc107';   // Amarillo (En progreso)
            case ESTADO_FINALIZADA: return '#28a745';   // Verde (Listo)
            case ESTADO_CANCELADA: return '#6c757d';    // Gris (Cancelado)
            default: return '#6c757d';
        }
    };


    const renderDetailItem = (detalle) => (
        <View key={detalle.id_detalle_comanda} style={styles.cartItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.productName}>
                    **{detalle.cantidad}x** {detalle.producto?.nombre_producto || `Producto ID: ${detalle.producto_id}`}
                </Text>
                {detalle.descripcion ? (
                    <Text style={styles.orderDetailText}>
                        ✍️ **Nota:** {detalle.descripcion}
                    </Text>
                ) : null}
            </View>
        </View>
    );

    const renderComanda = ({ item }) => (
        <View style={[
            styles.orderCard,
            { borderColor: getStatusColor(item.estado_comanda), borderWidth: 2, paddingBottom: 10 }
        ]}>
            <View style={styles.orderHeader}>
                <Text style={[styles.orderTitle, { color: getStatusColor(item.estado_comanda) }]}>
                    {item.mesa} (ID: {item.comanda_id})
                </Text>
                <View style={[styles.orderStatusPill, { backgroundColor: getStatusColor(item.estado_comanda) }]}>
                    <Text style={styles.orderStatusText}>{item.estado_comanda.toUpperCase()}</Text>
                </View>
            </View>

            <Text style={styles.orderDetailText}>Mesonero: {item.nombre_mesonero || 'N/A'}</Text>
            <Text style={styles.orderDetailText}>Hora: {new Date(item.fecha_hora_comanda).toLocaleTimeString()}</Text>

            {/* DETALLES DE PRODUCTOS (DetallesComanda) */}
            <View style={styles.sectionSeparator}>
                <Text style={styles.sectionTitleOperative}>PEDIDO:</Text>
            </View>
            {item.detallesComanda.map(renderDetailItem)}

            {/* Motivo de Cancelación (solo si existe) */}
            {item.motivo_cancelacion && (
                <View style={{ marginTop: 8, backgroundColor: '#fff3cd', borderRadius: 6, padding: 8, borderLeftWidth: 3, borderLeftColor: '#dc3545' }}>
                    <Text style={{ fontSize: 12, color: '#856404', fontWeight: 'bold' }}>⚠️ Motivo de cancelación:</Text>
                    <Text style={{ fontSize: 13, color: '#664d03', marginTop: 2 }}>{item.motivo_cancelacion}</Text>
                </View>
            )}

            {/* ACCIONES DEL COCINERO */}
            <View style={styles.orderActions}>
                {/* 1. Botón INICIAR PREPARACIÓN (Solo visible si está ABIERTA) */}
                {item.estado_comanda === ESTADO_ABIERTA && (
                    <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: '#007bff' }]}
                        onPress={() => handleStartPreparation(item.comanda_id)}
                        disabled={isUpdating}
                    >
                        <Text style={styles.smallButtonText}>INICIAR PREPARACIÓN</Text>
                    </TouchableOpacity>
                )}

                {/* 2. Botón MARCAR LISTO (Solo visible si está PREPARANDO) */}
                {item.estado_comanda === ESTADO_PREPARANDO && (
                    <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: '#28a745' }]}
                        onPress={() => handleMarkReady(item.comanda_id)}
                        disabled={isUpdating}
                    >
                        <Text style={styles.smallButtonText}>MARCAR LISTO ✅</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.dashboardContainer}>
            <Text style={[styles.dashboardTitle, { marginTop: 35 }]}>
                🍳 Hola, Cocinero {userData?.username || ''}
            </Text>

            <Text style={styles.sectionTitleOperative}>
                Órdenes Pendientes (Actualización cada 10s)
            </Text>

            {isListLoading && comandas.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#dc3545" />
                    <Text style={styles.loadingText}>Buscando nuevos pedidos...</Text>
                </View>
            ) : comandas.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="check-circle" size={50} color="#28a745" />
                    <Text style={styles.emptyText}>¡Todo al día! No hay pedidos pendientes.</Text>
                </View>
            ) : (
                <FlatList
                    data={comandas}
                    keyExtractor={(item) => item.comanda_id.toString()}
                    renderItem={renderComanda}
                    contentContainerStyle={{ paddingBottom: 20, marginTop: 10 }}
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isListLoading && comandas.length > 0}
                            onRefresh={fetchCocineroComandas}
                            colors={['#dc3545']}
                        />
                    }
                />
            )}

            {/* BOTÓN CERRAR SESIÓN */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6c757d', marginTop: 15 }]}
                onPress={() => Alert.alert(
                    'Cerrar Sesión',
                    '¿Estás seguro que quieres salir?',
                    [{ text: 'No', style: 'cancel' }, { text: 'Sí', onPress: logout }]
                )}
            >
                <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
        </View>
    );
};