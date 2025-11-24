import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

export const ComandaCreationInitial = ({ navigation }) => {
    const { userToken, API_BASE_URL } = useContext(AuthContext);
    const [mesa, setMesa] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateComanda = async () => {
        if (!mesa.trim()) {
            Alert.alert('Error', 'Debe ingresar un número de mesa válido.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. PASO 1: CREAR LA COMANDA PRINCIPAL (POST /comandas)
            // Solo necesitamos enviar la 'mesa', el backend se encarga del estado inicial y mesonero.
            const comandaPayload = {
                mesa: mesa.trim(),
            };

            const response = await axios.post(`${API_BASE_URL}/comandas`, comandaPayload, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            
            const newComandaId = response.data.comanda_id; // Obtenemos el ID de la nueva comanda
            
            // Éxito en la creación de la comanda principal
            Alert.alert(
                'Éxito', 
                `Comanda #${newComandaId} para la Mesa ${mesa} creada. Ahora agregue los productos.`,
                [
                    {
                        text: 'OK',
                        // 2. REDIRIGIR AL EDITOR DE DETALLES
                        onPress: () => navigation.replace('ComandaDetailsEditor', { 
                            comandaId: newComandaId, 
                            mesa: mesa 
                        }),
                    },
                ]
            );

        } catch (error) {
            console.error('Error al crear comanda inicial:', error.response?.data || error.message);
            Alert.alert('Error', 'No se pudo crear la comanda. Intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.dashboardContainer}
        >
            <View style={{ flex: 1, padding: 20 }}>
                <Text style={styles.dashboardTitle}>Nueva Comanda</Text>
                <Text style={styles.sectionTitle}>1. Ingrese Número de Mesa</Text>

                <View style={styles.inputContainer}>
                    <MaterialIcons name="table-bar" size={24} color="#333" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Número de Mesa (ej. 1, 15, Terraza A)"
                        value={mesa}
                        onChangeText={setMesa}
                        keyboardType="default" // Usamos 'default' ya que mesa puede ser string
                        autoCapitalize="words"
                        returnKeyType="done"
                        editable={!isLoading}
                    />
                </View>

                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Estado Inicial:</Text>
                    <Text style={styles.summaryValueSmall}>ABIERTA (El Mesonero la abre)</Text>
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleCreateComanda}
                    disabled={isLoading || !mesa.trim()}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>CONTINUAR (Crear Comanda)</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};