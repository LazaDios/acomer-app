import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';

const UserManagementScreen = ({ navigation }) => {
    const { userToken, API_BASE_URL } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/users`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "No se pudieron cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    }, [userToken, API_BASE_URL]);

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [fetchUsers])
    );

    const handleDelete = (userId, userName) => {
        Alert.alert(
            "Confirmar Eliminación",
            `¿Estás seguro de que deseas eliminar al usuario "${userName}"? Esto no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_BASE_URL}/auth/users/${userId}`, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert("Éxito", "Usuario eliminado correctamente.");
                            fetchUsers();
                        } catch (error) {
                            console.error("Error deleting user:", error);
                            Alert.alert("Error", "No se pudo eliminar el usuario.");
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (user) => {
        // Navegar a UserCreationScreen pero pasando params
        navigation.navigate('UserCreation', { userToEdit: user });
    };

    const getRoleColor = (roleName) => {
        switch (roleName) {
            case 'administrador': return '#6f42c1';
            case 'mesonero': return '#007bff';
            case 'cocinero': return '#e83e8c';
            default: return '#6c757d';
        }
    };

    const renderItem = ({ item }) => (
        <View style={localStyles.card}>
            <View style={localStyles.avatarContainer}>
                <MaterialIcons name="person" size={40} color="#555" />
            </View>
            <View style={localStyles.infoContainer}>
                <Text style={localStyles.name}>{item.nombre_completo}</Text>
                <Text style={localStyles.username}>@{item.username}</Text>
                <View style={[localStyles.roleBadge, { backgroundColor: getRoleColor(item.rol?.nombre) }]}>
                    <Text style={localStyles.roleText}>{item.rol?.nombre?.toUpperCase()}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                    style={[localStyles.deleteButton, { marginRight: 10 }]}
                    onPress={() => handleEdit(item)}
                >
                    <MaterialIcons name="edit" size={24} color="#007bff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={localStyles.deleteButton}
                    onPress={() => handleDelete(item.id_usuario, item.username)}
                >
                    <MaterialIcons name="delete-outline" size={24} color="#dc3545" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header manual removido */}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF4B3A" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id_usuario.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>No hay usuarios registrados.</Text>}
                />
            )}

            {/* Floating Action Button for Adding User */}
            <TouchableOpacity
                style={localStyles.fab}
                onPress={() => navigation.navigate('UserCreation', { userToEdit: null })}
            >
                <MaterialIcons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View >
    );
};

const localStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    username: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    roleBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 10,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#28a745',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});

export default UserManagementScreen;
