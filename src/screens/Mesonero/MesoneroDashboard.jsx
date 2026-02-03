// src/screens/Mesonero/MesoneroDashboard.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, RefreshControl, Modal, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

const ESTADO_ABIERTA = 'Abierta';
const ESTADO_FINALIZADA = 'Finalizada';
const ESTADO_PREPARANDO = 'Preparando';
const ESTADO_CERRADA = 'Cerrada';
const ESTADO_CANCELADA = 'Cancelada';

export const MesoneroDashboard = ({ navigation }) => {
    // Extraemos userData para obtener el nombre
    const { userToken, API_BASE_URL, logout, restaurant, userRole } = useContext(AuthContext);

    const [comandas, setComandas] = useState([]);
    const [tasaCambio, setTasaCambio] = useState(0); // Nuevo estado para la tasa
    const [isListLoading, setIsListLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Estados Modal Cancelación
    const [modalVisible, setModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [targetComandaId, setTargetComandaId] = useState(null); // RESTORED
    // Estado para Modal de Cobro
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentRef, setPaymentRef] = useState('');
    const [selectedPaymentComandaId, setSelectedPaymentComandaId] = useState(null);

    const getPriority = (status) => {
        switch (status) {
            case ESTADO_FINALIZADA: return 1;
            case ESTADO_ABIERTA: return 2;
            case ESTADO_PREPARANDO: return 3;
            case ESTADO_CANCELADA: return 4;
            default: return 5;
        }
    };

    // Función para obtener la tasa de cambio actual
    const fetchTasa = useCallback(async () => {
        if (!restaurant?.id_restaurante) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/restaurantes/${restaurant.id_restaurante}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (response.data.tasa_cambio) {
                setTasaCambio(parseFloat(response.data.tasa_cambio));
            }
        } catch (error) {
            console.error("Error fetching rate:", error);
        }
    }, [userToken, API_BASE_URL, restaurant]);

    const fetchComandas = useCallback(async () => {
        setIsListLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/detalle-comandas/mesonero/pendientes`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            let fetchedComandas = response.data;

            fetchedComandas.sort((a, b) => {
                const priorityA = getPriority(a.estado_comanda);
                const priorityB = getPriority(b.estado_comanda);
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(b.fecha_hora_comanda).getTime() - new Date(a.fecha_hora_comanda).getTime();
            });

            setComandas(fetchedComandas.filter(c => c.estado_comanda !== ESTADO_CERRADA));

        } catch (error) {
            console.error('Error al cargar comandas:', error.response?.data || error.message);
        } finally {
            setIsListLoading(false);
        }
    }, [userToken, API_BASE_URL]);

    useEffect(() => {
        fetchComandas();
        fetchTasa(); // Cargar la tasa al iniciar
        const interval = setInterval(() => {
            if (!isUpdating && !modalVisible && !paymentModalVisible) {
                fetchComandas();
                fetchTasa(); // Actualizar tasa periódicamente también
            }
        }, 10000);

        const unsubscribeFocus = navigation.addListener('focus', () => {
            fetchComandas();
            fetchTasa();
        });
        return () => {
            clearInterval(interval);
            unsubscribeFocus();
        };
    }, [fetchComandas, fetchTasa, isUpdating, modalVisible, paymentModalVisible, navigation]);

    const openCancelModal = (id) => {
        setTargetComandaId(id);
        setCancelReason('');
        setModalVisible(true);
    };

    const confirmCancellation = async () => {
        if (!cancelReason.trim()) {
            Alert.alert('Requerido', 'Por favor ingrese un motivo.');
            return;
        }
        setModalVisible(false);
        setIsUpdating(true);
        try {
            await axios.patch(`${API_BASE_URL}/comandas/${targetComandaId}/status`, {
                estado: ESTADO_CANCELADA,
                motivo: cancelReason
            }, { headers: { Authorization: `Bearer ${userToken}` } });
            Alert.alert('Cancelada', 'Pedido cancelado.');
            fetchComandas();
        } catch (error) {
            Alert.alert('Error', 'No se pudo cancelar.');
        } finally {
            setIsUpdating(false);
            setTargetComandaId(null);
        }
    };

    const openPaymentModal = (comandaId) => {
        setSelectedPaymentComandaId(comandaId);
        setPaymentRef('');
        setPaymentModalVisible(true);
    };

    const confirmPayment = async () => {
        setPaymentModalVisible(false);
        setIsUpdating(true);
        try {
            await axios.patch(`${API_BASE_URL}/comandas/${selectedPaymentComandaId}/status`,
                {
                    estado: ESTADO_CERRADA,
                    referencia_pago: paymentRef // Enviamos la referencia opcional
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            Alert.alert('Éxito', 'Comanda COBRADA y cerrada.');
            fetchComandas();
        } catch (e) { Alert.alert('Error', 'Fallo al actualizar'); }
        finally { setIsUpdating(false); setSelectedPaymentComandaId(null); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case ESTADO_FINALIZADA: return '#28a745';
            case ESTADO_ABIERTA: return '#007bff';
            case ESTADO_PREPARANDO: return '#ffc107';
            case ESTADO_CANCELADA: return '#dc3545';
            default: return '#6c757d';
        }
    };

    const renderComanda = ({ item }) => {
        const esEditable = item.estado_comanda === ESTADO_ABIERTA || item.estado_comanda === ESTADO_PREPARANDO;
        const esCancelable = item.estado_comanda !== ESTADO_FINALIZADA && item.estado_comanda !== ESTADO_CANCELADA;
        const totalUsd = parseFloat(item.total_comanda || 0);
        const totalBs = tasaCambio > 0 ? (totalUsd * tasaCambio).toFixed(2) : null;

        return (
            <View style={[styles.orderCard, { borderColor: getStatusColor(item.estado_comanda), borderWidth: item.estado_comanda === ESTADO_FINALIZADA ? 4 : 2 }]}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderTitle}>Mesa {item.mesa}</Text>
                    <View style={[styles.orderStatusPill, { backgroundColor: getStatusColor(item.estado_comanda) }]}>
                        <Text style={styles.orderStatusText}>{item.estado_comanda.toUpperCase()}</Text>
                    </View>
                </View>

                {/* PRECIOS EN AMBAS MONEDAS */}
                <View style={{ marginBottom: 10 }}>
                    <Text style={styles.orderDetailText}>Total: ${totalUsd.toFixed(2)}</Text>
                    {totalBs && (
                        <Text style={[styles.orderDetailText, { color: '#28a745', fontWeight: 'bold' }]}>
                            Bs {totalBs} (Tasa: {tasaCambio})
                        </Text>
                    )}
                </View>

                <View style={styles.orderActions}>
                    <TouchableOpacity
                        style={[styles.smallButton, {
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: esEditable ? '#007bff' : '#17a2b8',
                            paddingHorizontal: 15
                        }]}
                        onPress={() => {
                            if (esEditable) navigation.navigate('ComandaDetailsEditor', { comandaId: item.comanda_id, mesa: item.mesa });
                            else navigation.navigate('ComandaDetailsViewer', { comandaId: item.comanda_id, mesa: item.mesa, detallesComanda: item.detallesComanda, totalComanda: item.total_comanda });
                        }}
                        disabled={isUpdating}
                    >
                        <Text style={[styles.smallButtonText, { color: esEditable ? '#007bff' : '#17a2b8' }]}>{esEditable ? 'EDITAR' : 'VER DETALLES'}</Text>
                    </TouchableOpacity>

                    {item.estado_comanda === ESTADO_FINALIZADA && (
                        <TouchableOpacity
                            style={[styles.smallButton, {
                                backgroundColor: 'transparent',
                                borderWidth: 1,
                                borderColor: '#28a745',
                                paddingHorizontal: 15
                            }]}
                            onPress={() => openPaymentModal(item.comanda_id)} // ABRIR MODAL PAGO
                            disabled={isUpdating}
                        >
                            <Text style={[styles.smallButtonText, { color: '#28a745' }]}>COBRADA</Text>
                        </TouchableOpacity>
                    )}

                    {esCancelable && (
                        <TouchableOpacity
                            style={[{
                                padding: 8,
                                borderRadius: 8,
                                marginLeft: 10,
                                borderWidth: 1,
                                borderColor: '#dc3545',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }]}
                            onPress={() => openCancelModal(item.comanda_id)}
                            disabled={isUpdating}
                        >
                            <MaterialIcons name="close" size={20} color="#dc3545" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.dashboardContainer}>
            {/* 1. TÍTULO PERSONALIZADO */}
            <Text style={styles.dashboardTitle}>
                Hola, Mesonero ({userRole || 'Staff'})
            </Text>

            {/* 2. BOTÓN DE CREAR COMANDA (Ahora arriba y ancho completo) */}
            <TouchableOpacity
                style={styles.actionButtonPrimary}
                onPress={() => navigation.navigate('ComandaCreationInitial')}
            >
                <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>NUEVA COMANDA</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitleOperative}>Comandas Activas ({comandas.length})</Text>

            {isListLoading && comandas.length === 0 ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>
            ) : comandas.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="table-chart" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>Sin comandas activas.</Text>
                </View>
            ) : (
                <FlatList
                    data={comandas}
                    keyExtractor={(item) => item.comanda_id.toString()}
                    renderItem={renderComanda}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    style={{ flex: 1 }}
                    refreshControl={<RefreshControl refreshing={isListLoading} onRefresh={fetchComandas} colors={['#007bff']} />}
                />
            )}

            {/* MODAL CANCELACIÓN */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Cancelar Pedido #{targetComandaId}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Motivo de cancelación..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline={true}
                            numberOfLines={3}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Volver</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmCancellation}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL PAGO (COBRAR) */}
            <Modal animationType="slide" transparent={true} visible={paymentModalVisible} onRequestClose={() => setPaymentModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Cobrar Comanda</Text>
                        <Text style={{ marginBottom: 10, color: '#666' }}>Ingresa referencia de pago (opcional)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ej: Zelle REF-1234, Efectivo..."
                            value={paymentRef}
                            onChangeText={setPaymentRef}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPaymentModalVisible(false)}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: '#28a745' }]} onPress={confirmPayment}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>COBRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6c757d', position: 'absolute', bottom: 20, left: 20, right: 20 }]}
                onPress={() => Alert.alert('Cerrar Sesión', '¿Salir?', [{ text: 'No' }, { text: 'Sí', onPress: logout }])}
            >
                <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
        </View>
    );
};