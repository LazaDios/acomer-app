import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Componente para mostrar errores de forma limpia, centrada y en pantalla completa blanca.
 * Útil para validaciones importantes o errores de API que requieran atención total.
 */
const ErrorMessage = ({ message, onRetry, onBack, title = "Atención" }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <MaterialIcons name="info-outline" size={60} color="#FF6B6B" style={styles.icon} />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                <View style={styles.buttonContainer}>
                    {onRetry && (
                        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    )}

                    {onBack && (
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <Text style={styles.backButtonText}>Cerrar / Volver</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        zIndex: 9999, // Asegurar que esté por encima de todo
    },
    content: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 35,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: '#FF4B3A',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#FF4B3A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 15,
        paddingVertical: 10,
    },
    backButtonText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default ErrorMessage;
