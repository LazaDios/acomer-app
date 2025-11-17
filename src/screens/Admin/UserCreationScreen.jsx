import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; 
import axios from 'axios';
import { AuthContext, AVAILABLE_ROLES } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles';


// 1.  Define los roles con su id numérico
const ROLES = [
  { id: 1, name: 'administrador' },
  { id: 2, name: 'mesonero' },
  { id: 3, name: 'cocinero' },
];

// Componente para crear nuevos usuarios
const UserCreationScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre_completo, setNombreCompleto] = useState('');
  // Por defecto selecciona el primer rol disponible
  const [rolId, setRole] = useState(ROLES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Obtenemos el token del administrador y la URL base de la API
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  const navigation = useNavigation();

  // **********************************************
  // LÓGICA DE CREACIÓN DE USUARIO (TU PUNTO CRÍTICO)
  // **********************************************
  const createUser = async () => {
    if (!username || !password || !nombre_completo ||!rolId) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Endpoint: /api/v1/users
      await axios.post(`${API_BASE_URL}/auth/register`, 
        { 
          username,
          password,
          nombre_completo, 
          rolId: Number(rolId) 
        },
        {
          headers: {
            // Enviamos el token del administrador que está logueado
            Authorization: `Bearer ${userToken}`, 
          },
        }
      );

      Alert.alert('Éxito', `Usuario '${username}' creado con el rol: ${rolId}.`);

      setUsername('');
      setPassword('');
      setNombreCompleto('');
      setRole(ROLES[0].id); // <-- número 1,2 o 3
      
      navigation.goBack(); 

    } catch (error) {
      console.error('Error al crear usuario:', error);
      const message = error.response?.data?.message || 'Error de conexión o permisos insuficientes.';
      Alert.alert('Error de Creación', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>Crear Nuevo Usuario</Text>

      {/* Campo de Usuario */}
      <Text style={styles.label}>Nombre de Usuario:</Text>
      <View style={styles.inputContainerForm}>
        <TextInput
          style={styles.inputForm}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      {/* Campo de Contraseña */}
      <Text style={styles.label}>Contraseña:</Text>
      <View style={styles.inputContainerForm}>
        <TextInput
          style={styles.inputForm}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Campo de nombre completo */}
      <Text style={styles.label}>Nombre Completo de Personal:</Text>
      <View style={styles.inputContainerForm}>
        <TextInput
          style={styles.inputForm}
          value={nombre_completo}
          onChangeText={setNombreCompleto}
          autoCapitalize="none"
        />
      </View>

     {/* Selector de Rol */}
    <Text style={styles.label}>Rol:</Text>
    <View style={styles.pickerContainer}>
      {/* Selector de Rol */}
      <Picker
        selectedValue={rolId}
        onValueChange={(val) => setRole(val)} // val es number
      >
        {ROLES.map((r) => (
          <Picker.Item
            key={r.id}
            label={r.name.charAt(0).toUpperCase() + r.name.slice(1)}
            value={r.id} // ← número que mandarás a tu API
          />
        ))}
      </Picker>
    </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={createUser}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrar Usuario</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UserCreationScreen;