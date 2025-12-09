// src/screens/Mesonero/ComandaDetailsEditor.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

// Estados Sincronizados
const ESTADO_ABIERTA = 'Abierta'; // Estado inicial para nuevas comandas

export const ComandaDetailsEditor = ({ route, navigation }) => {
    const { userToken, API_BASE_URL } = useContext(AuthContext);

    // Parámetros de la ruta
    const { comandaId, mesa: mesaInicial } = route.params || {};

    // Determina el modo: Creación (false) o Edición (true)
    const isEditing = !!comandaId;

    // Estados
    const [mesa, setMesa] = useState(mesaInicial || '');
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [cartItems, setCartItems] = useState([]); // Nuevos productos a añadir
    const [existingItems, setExistingItems] = useState([]); // Productos ya guardados (Solo Edición)
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Cargar lista de productos del menú
    const fetchProductos = useCallback(async () => {
        try {
            // Asegúrate de que esta ruta coincida con tu backend (ej: /productos o /productos/activos)
            const response = await axios.get(`${API_BASE_URL}/productos`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setProductosDisponibles(response.data);
        } catch (error) {
            console.error('Error al cargar productos:', error.message);
            Alert.alert('Error', 'No se pudo cargar el menú.');
        } finally {
            setIsProductLoading(false);
        }
    }, [userToken, API_BASE_URL]);

    // 2. Cargar detalles existentes (Solo si estamos editando)
    const fetchExistingComanda = useCallback(async () => {
        if (!isEditing) return;

        try {
            // Requiere el endpoint GET /comandas/:id en el backend
            const response = await axios.get(`${API_BASE_URL}/comandas/${comandaId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const comandaData = response.data;
            // Si la mesa viene vacía en params, usamos la de la BD
            if (!mesa) setMesa(comandaData.mesa);

            // Guardamos los detalles existentes para mostrarlos (solo lectura)
            setExistingItems(comandaData.detallesComanda || []);

        } catch (error) {
            console.error('Error al cargar comanda:', error.message);
            Alert.alert('Error', 'No se pudo cargar la comanda existente.');
            navigation.goBack();
        }
    }, [isEditing, comandaId, mesa, userToken, API_BASE_URL, navigation]);

    useEffect(() => {
        fetchProductos();
        fetchExistingComanda();
    }, [fetchProductos, fetchExistingComanda]);

    // --- Lógica del Carrito (Nuevos Ítems) ---

    const handleAddProduct = (product) => {
        setCartItems(prevItems => {
            const index = prevItems.findIndex(item => item.producto_id === product.id_producto);
            if (index > -1) {
                // Si ya existe, aumentar cantidad
                const updated = [...prevItems];
                updated[index].cantidad += 1;
                return updated;
            } else {
                // Si es nuevo, agregar
                return [...prevItems, {
                    producto_id: product.id_producto,
                    nombre_producto: product.nombre_producto,
                    precio_producto: product.precio_producto,
                    cantidad: 1,
                    descripcion: ''
                }];
            }
        });
    };

    const updateCartItem = (index, field, value) => {
        setCartItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const removeCartItem = (index) => {
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    // --- Lógica para Items Existentes (EDITAR / ELIMINAR) ---

    // Marca un ítem existente como 'modificado' localmente para luego enviarlo
    const handleUpdateExisting = (index, field, value) => {
        setExistingItems(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            updated[index].isModified = true; // Flag para saber qué enviar
            return updated;
        });
    };

    const handleDeleteExisting = (item) => {
        Alert.alert(
            'Eliminar Producto',
            `¿Estás seguro de quitar "${item.producto?.nombre_producto}" del pedido?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // DELETE /detalle-comandas/:id
                            await axios.delete(`${API_BASE_URL}/detalle-comandas/${item.id_detalle_comanda}`, {
                                headers: { Authorization: `Bearer ${userToken}` },
                            });
                            // Actualizamos UI localmente quitándolo de la lista
                            setExistingItems(prev => prev.filter(i => i.id_detalle_comanda !== item.id_detalle_comanda));
                            Alert.alert('Eliminado', 'Producto retirado de la comanda.');
                        } catch (error) {
                            console.error('Error al eliminar detalle:', error);
                            Alert.alert('Error', 'No se pudo eliminar el producto.');
                        }
                    }
                }
            ]
        );
    };

    // --- Enviar Datos ---

    const handleSend = async () => {
        if (!mesa.trim()) {
            Alert.alert('Falta información', 'Por favor ingrese el número de mesa.');
            return;
        }
        const hasModifications = existingItems.some(i => i.isModified);

        if (cartItems.length === 0 && !hasModifications && isEditing) {
            Alert.alert('Sin Cambios', 'Agregue productos o modifique los existentes.');
            return;
        }

        if (cartItems.length === 0 && !isEditing) {
            Alert.alert('Carrito vacío', 'Agregue al menos un producto para crear la comanda.');
            return;
        }

        setIsSaving(true);
        try {
            // Preparamos el array de items según lo que espera tu DTO
            // Asegúrate que tu DTO espera "productoId" o "producto_id"
            const itemsToSend = cartItems.map(item => ({
                producto_id: item.producto_id, // Ojo con el nombre exacto en tu DTO NestJS
                cantidad: item.cantidad,
                descripcion: item.descripcion
            }));

            if (isEditing) {
                // 1. Enviar NUEVOS items (si hay)
                if (itemsToSend.length > 0) {
                    await axios.post(`${API_BASE_URL}/detalle-comandas`, {
                        comandaId: comandaId,
                        detalles: itemsToSend
                    }, { headers: { Authorization: `Bearer ${userToken}` } });
                }

                // 2. Enviar MODIFICACIONES de items existentes
                const modifiedItems = existingItems.filter(item => item.isModified);
                const patchPromises = modifiedItems.map(item =>
                    axios.patch(`${API_BASE_URL}/detalle-comandas/${comandaId}/${item.id_detalle_comanda}`, {
                        cantidad: item.cantidad,
                        descripcion: item.descripcion
                    }, { headers: { Authorization: `Bearer ${userToken}` } })
                );

                if (patchPromises.length > 0) {
                    await Promise.all(patchPromises);
                }

                if (itemsToSend.length > 0 || patchPromises.length > 0) {
                    Alert.alert('Actualizado', 'Pedido actualizado correctamente.');
                } else {
                    Alert.alert('Sin Cambios', 'No detectamos cambios para guardar.');
                    return; // No salir, dejar que navegue atrás
                }
            } else {
                // MODO CREACIÓN: Creamos comanda nueva
                // POST /comandas (asumiendo que este crea todo junto)
                // O el flujo de 2 pasos si tu backend lo requiere así.
                // Aquí asumo un endpoint que recibe todo junto o la lógica que ya tenías.

                // Si tu backend requiere crear comanda primero y luego detalles, 
                // necesitaríamos esa lógica aquí. Por ahora usaré un POST genérico.
                await axios.post(`${API_BASE_URL}/comandas/completa`, { // Ajusta esta ruta a tu backend real
                    mesa: mesa,
                    detalles: itemsToSend
                }, { headers: { Authorization: `Bearer ${userToken}` } });

                Alert.alert('Creado', 'Comanda creada exitosamente.');
            }

            navigation.goBack();

        } catch (error) {
            console.error('Error al enviar:', error.response?.data || error.message);
            Alert.alert('Error', 'No se pudo procesar la solicitud.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Renderizado ---

    if (isProductLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Cargando menú...</Text>
            </View>
        );
    }

    return (
        <View style={styles.dashboardContainer}>
            <Text style={styles.dashboardTitle}>
                {isEditing ? `Editar Comanda #${comandaId}` : 'Nueva Comanda'}
            </Text>

            {/* Input de Mesa */}
            <View style={styles.inputContainer}>
                <MaterialIcons name="table-restaurant" size={24} color="gray" />
                <TextInput
                    style={styles.input}
                    placeholder="Número de Mesa"
                    value={mesa}
                    onChangeText={setMesa}
                    editable={!isEditing} // No cambiar mesa si ya existe
                />
            </View>

            <ScrollView>
                {/* 1. Detalles Existentes (EDITABLES) */}
                {isEditing && existingItems.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Productos en Pedido ({existingItems.length})</Text>
                        {existingItems.map((item, index) => (
                            <View key={item.id_detalle_comanda} style={[styles.cartItem, { borderColor: '#b3d7ff', borderWidth: 1 }]}>
                                {/* Lado Izquierdo: Info y Controles */}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{item.producto?.nombre_producto || 'Producto'}</Text>

                                    {/* Controles de Cantidad */}
                                    <View style={styles.quantityContainer}>
                                        <TouchableOpacity onPress={() => {
                                            if (item.cantidad > 1) {
                                                handleUpdateExisting(index, 'cantidad', item.cantidad - 1);
                                            }
                                        }} style={[styles.quantityButton, { backgroundColor: '#ffe6e6' }]}>
                                            <MaterialIcons name="remove" size={24} color="#dc3545" />
                                        </TouchableOpacity>

                                        <Text style={styles.quantityText}>{item.cantidad}</Text>

                                        <TouchableOpacity onPress={() => handleUpdateExisting(index, 'cantidad', item.cantidad + 1)}
                                            style={[styles.quantityButton, { backgroundColor: '#e6fffa' }]}>
                                            <MaterialIcons name="add" size={24} color="#28a745" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Input de Nota */}
                                    <TextInput
                                        placeholder="Nota (ej. Sin cebolla)"
                                        style={styles.descriptionInput}
                                        value={item.descripcion}
                                        onChangeText={(text) => handleUpdateExisting(index, 'descripcion', text)}
                                    />
                                </View>

                                {/* Lado Derecho: Eliminar (API DIRECTA) */}
                                <TouchableOpacity onPress={() => handleDeleteExisting(item)}
                                    style={styles.deleteButton}>
                                    <MaterialIcons name="delete-outline" size={20} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* 2. Carrito de Nuevos Ítems */}
                <Text style={styles.sectionTitle}>Agregar Nuevos ({cartItems.length})</Text>

                {cartItems.map((item, index) => (
                    <View key={index} style={styles.cartItem}>
                        {/* Lado Izquierdo: Info y Controles */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName}>{item.nombre_producto}</Text>

                            {/* Controles de Cantidad */}
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity onPress={() => {
                                    if (item.cantidad > 1) updateCartItem(index, 'cantidad', item.cantidad - 1);
                                }} style={[styles.quantityButton, { backgroundColor: '#ffe6e6' }]}>
                                    {/* Fondo rojizo suave para (-) */}
                                    <MaterialIcons name="remove" size={24} color="#dc3545" />
                                </TouchableOpacity>

                                <Text style={styles.quantityText}>{item.cantidad}</Text>

                                <TouchableOpacity onPress={() => updateCartItem(index, 'cantidad', item.cantidad + 1)}
                                    style={[styles.quantityButton, { backgroundColor: '#e6fffa' }]}>
                                    {/* Fondo verdoso suave para (+) */}
                                    <MaterialIcons name="add" size={24} color="#28a745" />
                                </TouchableOpacity>
                            </View>

                            {/* Input de Nota */}
                            <TextInput
                                placeholder="Nota (ej. Sin cebolla)"
                                style={styles.descriptionInput}
                                value={item.descripcion}
                                onChangeText={(text) => updateCartItem(index, 'descripcion', text)}
                            />
                        </View>

                        {/* Lado Derecho: Eliminar */}
                        <TouchableOpacity onPress={() => removeCartItem(index)}
                            style={styles.deleteButton}>
                            <MaterialIcons name="delete-outline" size={24} color="#dc3545" />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Lista de Selección de Productos */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Menú</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {productosDisponibles.map(prod => (
                        <TouchableOpacity
                            key={prod.id_producto}
                            style={styles.productItemCard} // Asegúrate de tener este estilo o usa uno inline
                            onPress={() => handleAddProduct(prod)}
                        >
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <MaterialIcons name="restaurant-menu" size={24} color="#007bff" style={{ marginBottom: 5 }} />
                                <Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>{prod.nombre_producto}</Text>
                                <Text style={{ color: 'green', fontWeight: 'bold', marginTop: 2 }}>${prod.precio_producto}</Text>
                            </View>
                            <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
                                <MaterialIcons name="add-circle" size={20} color="#007bff" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: isSaving ? '#ccc' : '#007bff', marginTop: 10 }]}
                onPress={handleSend}
                disabled={isSaving}
            >
                <Text style={styles.buttonText}>
                    {isSaving ? 'Enviando...' : (isEditing ? 'Añadir a Comanda' : 'Crear Comanda')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};