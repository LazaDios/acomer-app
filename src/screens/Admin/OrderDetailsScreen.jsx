import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { styles as appStyles } from '../../styles/AppStyles'; // Importamos los estilos globales

const OrderDetailsScreen = ({ route, navigation }) => {
    
    // Obtenemos el ID de la comanda de los parámetros de navegación
    const { comandaId } = route.params;

    const [comanda, setComanda] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { userToken, API_BASE_URL } = useContext(AuthContext);

    useEffect(() => {
        // Establecer el título de la pantalla al cargar
        navigation.setOptions({ title: `Detalles - Comanda #${comandaId}` });
        fetchComandaDetails();
    }, [comandaId]);

    const fetchComandaDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Usando la ruta /api/v1/detalle-comandas/{id}
            const response = await axios.get(`${API_BASE_URL}/detalle-comandas/${comandaId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setComanda(response.data);
            
        } catch (err) {
            console.error('Error al cargar detalles de comanda:', err);
            setError('No se pudieron cargar los detalles de la comanda. Verifique el ID y la ruta del API.');
            // Alert.alert('Error', 'No se pudieron cargar los detalles de la comanda.');
        } finally {
            setIsLoading(false);
        }
    };
    
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

    if (isLoading) {
        return (
            <View style={appStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={appStyles.loadingText}>Cargando detalles...</Text>
            </View>
        );
    }

    if (error || !comanda) {
        return (
            <View style={appStyles.errorContainer}>
                <MaterialIcons name="error-outline" size={50} color="#dc3545" />
                <Text style={appStyles.errorText}>{error || `No se encontró la comanda con ID ${comandaId}.`}</Text>
                {/* Botón opcional para reintentar */}
                <TouchableOpacity onPress={fetchComandaDetails} style={appStyles.button}>
                     <Text style={appStyles.buttonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    const detallesComanda = comanda.detallesComanda || []; 

    return (
        <ScrollView style={appStyles.dashboardContainer} contentContainerStyle={{ paddingBottom: 30 }}>
            
            {/* 📋 ENCABEZADO DE LA COMANDA */}
            <View style={styles.headerBox}>
                <Text style={styles.comandaTitle}>Comanda #{comanda.comanda_id}</Text>
                <View style={[
                    styles.statusPill, 
                    { backgroundColor: getStatusColor(comanda.estado_comanda) }
                ]}>
                    <Text style={styles.statusText}>{comanda.estado_comanda || 'N/A'}</Text>
                </View>
            </View>
            
            {/* ℹ️ INFORMACIÓN GENERAL */}
            <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Mesa/Cliente:</Text>
                <Text style={styles.infoValue}>{comanda.mesa || 'N/A'}</Text>

                <Text style={styles.infoLabel}>Mesonero:</Text>
                <Text style={styles.infoValue}>{comanda.nombre_mesonero || 'N/A'}</Text>
                
                <Text style={styles.infoLabel}>Fecha/Hora:</Text>
                <Text style={styles.infoValue}>
                    {comanda.fecha_hora_comanda ? new Date(comanda.fecha_hora_comanda).toLocaleString() : 'N/A'}
                </Text>
            </View>

            {/* 🍕 DETALLES DE PRODUCTOS (Detalles-comandas) */}
            <Text style={styles.sectionTitle}>Detalle de Productos ({detallesComanda.length})</Text>
            <View style={styles.itemsContainer}>
                
                {/* Encabezado de la tabla de detalles */}
                <View style={[styles.itemRow, styles.headerRow]}>
                    <Text style={[styles.itemQuantity, styles.headerText]}>Cant.</Text>
                    <Text style={[styles.itemName, styles.headerText, { flex: 0.55 }]}>Producto</Text>
                    <Text style={[styles.itemPrice, styles.headerText]}>P. Unit.</Text>
                    <Text style={[styles.itemPrice, styles.headerText]}>Subtotal</Text>
                </View>
                
                {detallesComanda.length > 0 ? (
                    detallesComanda.map((item) => (
                        <View key={item.id_detalle_comanda} style={styles.itemRow}>
                            {/* Usamos item.cantidad */}
                            <Text style={styles.itemQuantity}>{item.cantidad}</Text>
                            
                            {/* Usamos item.producto.nombre_producto */}
                            <Text style={[styles.itemName, { flex: 0.55 }]}>{item.producto?.nombre_producto || 'N/A'}</Text>
                            
                            {/* Usamos item.precioUnitario */}
                            <Text style={styles.itemPrice}>${parseFloat(item.precioUnitario || 0).toFixed(2)}</Text>
                            
                            {/* Usamos item.subtotal (valor ya calculado) */}
                            <Text style={styles.itemPrice}>${parseFloat(item.subtotal || 0).toFixed(2)}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyDetail}>No hay productos registrados para esta comanda.</Text>
                )}
            </View>

            {/* 💰 TOTAL FINAL */}
            <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>TOTAL COMANDA:</Text>
                <Text style={styles.totalValue}>${parseFloat(comanda.total_comanda || 0).toFixed(2)}</Text>
            </View>
            
            {/* Opcional: Agregar Botones de Acción (Ej. Cerrar, Imprimir, etc.) */}
            {/* <TouchableOpacity style={[appStyles.button, { marginTop: 20, backgroundColor: getStatusColor(comanda.estado_comanda) }]} disabled={comanda.estado_comanda === 'Cerrada'}>
                <Text style={appStyles.buttonText}>Cerrar Comanda</Text>
            </TouchableOpacity> */}
            
        </ScrollView>
    );
};

// --- ESTILOS ESPECÍFICOS ---
const styles = StyleSheet.create({
    headerBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 20,
    },
    comandaTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    infoSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6c757d',
        marginTop: 5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#343a40',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 10,
        paddingTop: 10,
    },
    itemsContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
    headerRow: {
        backgroundColor: '#e9ecef',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
        paddingVertical: 10,
    },
    headerText: {
        fontWeight: 'bold',
        color: '#343a40',
        fontSize: 14,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        alignItems: 'center',
    },
    itemQuantity: {
        fontWeight: 'bold',
        color: '#343a40',
        width: '10%',
        textAlign: 'center',
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        color: '#343a40',
        paddingHorizontal: 5,
    },
    itemPrice: {
        width: '20%', // Reducimos el ancho para que quepan 4 columnas
        fontWeight: '600',
        color: '#495057',
        fontSize: 14,
        textAlign: 'right',
    },
    emptyDetail: {
        textAlign: 'center',
        padding: 20,
        color: '#6c757d',
    },
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        padding: 15,
        backgroundColor: '#d4edda', 
        borderRadius: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#155724',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#155724',
    },
});

export default OrderDetailsScreen;