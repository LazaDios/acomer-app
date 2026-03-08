import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal, ScrollView } from 'react-native';
import { useNavigation as _unused, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

// Estados Sincronizados
const ESTADO_PREPARANDO = 'Preparando'; // Nota: Usamos la capitalización de la API
const ESTADO_FINALIZADA = 'Finalizada';
const ESTADO_ABIERTA = 'Abierta';
const ESTADO_CANCELADA = 'Cancelada'; // El cocinero debe verlas para referencia

export const CocineroDashboard = ({ navigation }) => {
    const { userToken, API_BASE_URL, logout, userData, socket } = useContext(AuthContext);

    const [comandas, setComandas] = useState([]);
    const [isListLoading, setIsListLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedComanda, setSelectedComanda] = useState(null);
    const isFocused = useIsFocused();
    const isFocusedRef = React.useRef(isFocused);
    const lastSocketFetchRef = React.useRef(0);

    useEffect(() => {
        isFocusedRef.current = isFocused;
    }, [isFocused]);

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

            const today = new Date().toDateString();

            setComandas(fetchedComandas.filter(c => {
                // Si la comanda está finalizada, nunca se muestra en pendientes
                if (c.estado_comanda === ESTADO_FINALIZADA) return false;

                // Si la comanda está cancelada, solo se muestra si es de hoy
                if (c.estado_comanda === ESTADO_CANCELADA) {
                    const comandaDate = new Date(c.fecha_hora_comanda).toDateString();
                    return comandaDate === today;
                }

                // Para el resto (Abierta, Preparando), se muestran siempre
                return true;
            }));

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

    // --- REF PARA EVITAR CIERRES STALE EN SOCKETS ---
    const fetchRef = React.useRef(fetchCocineroComandas);
    useEffect(() => {
        fetchRef.current = fetchCocineroComandas;
    }, [fetchCocineroComandas]);

    // Efecto 2: WebSocket compartido global
    useEffect(() => {
        if (!socket) return;

        console.log('🔗 Suscribiendo listeners Cocinero (Socket Global)...');

        const updateListener = () => {
            if (!isFocusedRef.current) return;
            const now = Date.now();
            if (now - lastSocketFetchRef.current > 5000) {
                lastSocketFetchRef.current = now;
                if (fetchRef.current) fetchRef.current(true);
            }
        };

        socket.on('comandaUpdated', updateListener);
        socket.on('comandaToKitchen', updateListener);
        socket.on('comandaCanceladaToKitchen', updateListener);

        return () => {
            console.log('❌ Quitantolisteners Cocinero');
            socket.off('comandaUpdated', updateListener);
            socket.off('comandaToKitchen', updateListener);
            socket.off('comandaCanceladaToKitchen', updateListener);
        };
    }, [socket]);


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
            setSelectedComanda(null); // Cerrar modal al actualizar
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

    const renderComanda = useCallback(({ item }) => (
        <TouchableOpacity
            style={[
                styles.orderCard,
                { borderColor: getStatusColor(item.estado_comanda), borderWidth: 2, paddingBottom: 15 }
            ]}
            onPress={() => setSelectedComanda(item)}
        >
            <View style={styles.orderHeader}>
                <Text style={[styles.orderTitle, { color: getStatusColor(item.estado_comanda), fontSize: 22, fontWeight: 'bold' }]}>
                    Mesa {item.mesa}
                </Text>
                <View style={[styles.orderStatusPill, { backgroundColor: getStatusColor(item.estado_comanda) }]}>
                    <Text style={styles.orderStatusText}>{item.estado_comanda.toUpperCase()}</Text>
                </View>
            </View>

            <Text style={[styles.orderDetailText, { fontSize: 16, marginTop: 5 }]}>👤 Mesonero: {item.nombre_mesonero || 'N/A'}</Text>
            <Text style={[styles.orderDetailText, { fontSize: 16 }]}>🕒 Hora: {new Date(item.fecha_hora_comanda).toLocaleTimeString()}</Text>

            <Text style={{ textAlign: 'center', color: '#007bff', marginTop: 12, fontWeight: 'bold' }}>
                👉 TOCA PARA VER DETALLES ({item.detallesComanda?.length || 0} artículos)
            </Text>
        </TouchableOpacity>
    ), [getStatusColor]);

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
                    // OPTIMIZACIONES EXTREMAS (Evitan cierres por memoria gráfica)
                    removeClippedSubviews={true}
                    initialNumToRender={3}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                />
            )}

            {/* MODAL DETALLES DE LA COMANDA */}
            {selectedComanda && (
                <Modal animationType="slide" transparent={true} visible={!!selectedComanda} onRequestClose={() => setSelectedComanda(null)}>
                    <View style={styles.centeredView}>
                        <View style={[styles.modalView, { width: '90%', maxHeight: '80%', padding: 15 }]}>
                            <Text style={[styles.modalTitle, { color: getStatusColor(selectedComanda.estado_comanda), marginBottom: 15 }]}>
                                Mesa {selectedComanda.mesa} - Detalles
                            </Text>

                            <ScrollView style={{ width: '100%', marginBottom: 15 }}>
                                {(selectedComanda.detallesComanda || []).map(renderDetailItem)}

                                {selectedComanda.motivo_cancelacion && (
                                    <View style={{ marginTop: 8, backgroundColor: '#fff3cd', borderRadius: 6, padding: 8, borderLeftWidth: 3, borderLeftColor: '#dc3545' }}>
                                        <Text style={{ fontSize: 12, color: '#856404', fontWeight: 'bold' }}>⚠️ Motivo de cancelación:</Text>
                                        <Text style={{ fontSize: 13, color: '#664d03', marginTop: 2 }}>{selectedComanda.motivo_cancelacion}</Text>
                                    </View>
                                )}
                            </ScrollView>

                            {/* ACCIONES DEL COCINERO EN EL MODAL */}
                            <View style={{ width: '100%' }}>
                                {selectedComanda.estado_comanda === ESTADO_ABIERTA && (
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: '#007bff', marginBottom: 10 }]}
                                        onPress={() => handleStartPreparation(selectedComanda.comanda_id)}
                                        disabled={isUpdating}
                                    >
                                        <Text style={styles.buttonText}>INICIAR PREPARACIÓN</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedComanda.estado_comanda === ESTADO_PREPARANDO && (
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: '#28a745', marginBottom: 10 }]}
                                        onPress={() => handleMarkReady(selectedComanda.comanda_id)}
                                        disabled={isUpdating}
                                    >
                                        <Text style={styles.buttonText}>MARCAR LISTO ✅</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={() => setSelectedComanda(null)}>
                                    <Text style={styles.buttonText}>CERRAR PANTALLA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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