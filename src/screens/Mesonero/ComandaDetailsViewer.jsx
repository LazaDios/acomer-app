import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../../styles/AppStyles';

// NOTA: Esta versión NO llama a la API. Espera que los detalles 
//       completos (con producto anidado) sean pasados desde el Dashboard.

export const ComandaDetailsViewer = ({ route, navigation }) => {
    // 1. Obtener datos de la ruta (ya vienen con los detalles y la relación 'producto')
    const { comandaId, mesa, detallesComanda, totalComanda } = route.params;

    const total = parseFloat(totalComanda || 0).toFixed(2);
    const details = detallesComanda || []; // Aseguramos que sea un array

    // La lógica de carga de API fue eliminada ya que los datos vienen precargados.

    return (
        <View style={styles.dashboardContainer}>
            <Text style={styles.dashboardTitle}>Pedido: Mesa {mesa} (ID: {comandaId})</Text>
            
            <Text style={styles.sectionTitle}>Productos Solicitados</Text>

            <FlatList
                data={details}
                keyExtractor={(item, index) => item.id_detalle_comanda ? item.id_detalle_comanda.toString() : index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.productName}>
                                **{item.cantidad}x** {
                                    // Usamos la relación 'producto' y su 'nombre_producto', que ahora SÍ viene anidada.
                                    item.producto?.nombre_producto || item.descripcion || `[Producto ID: ${item.producto_id}]`
                                }
                            </Text>
                            {item.descripcion ? (
                                <Text style={styles.orderDetailText}>
                                    Descripción: {item.descripcion}
                                </Text>
                            ) : null}
                        </View>
                        <Text style={styles.summaryValueSmall}>
                            ${parseFloat(item.total_detalle || item.subtotal || 0).toFixed(2)}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="list-alt" size={40} color="#ccc" />
                        <Text style={styles.emptyText}>Esta comanda no tiene productos registrados.</Text>
                    </View>
                )}
            />

            {/* Total de la Comanda */}
            <View style={[styles.summaryBox, { marginTop: 20 }]}>
                <Text style={styles.summaryLabel}>TOTAL DE LA COMANDA:</Text>
                <Text style={styles.summaryValue}>${total}</Text>
            </View>
            
            {/* Botón de Regreso */}
            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6c757d', marginTop: 20 }]}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.buttonText}>REGRESAR</Text>
            </TouchableOpacity>
        </View>
    );
};