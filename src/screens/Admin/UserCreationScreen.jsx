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

// Componente para crear O EDITAR usuarios
const UserCreationScreen = ({ route }) => {
  // Params puede venir vacío si es creación nueva
  const userToEdit = route.params?.userToEdit;
  const isEditing = !!userToEdit;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre_completo, setNombreCompleto] = useState('');
  // Por defecto selecciona el primer rol disponible
  const [rolId, setRole] = useState(ROLES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Obtenemos el token del administrador y la URL base de la API
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  const navigation = useNavigation();

  // Efecto para cargar datos si estamos EDITANDO
  React.useEffect(() => {
    if (isEditing && userToEdit) {
      setUsername(userToEdit.username);
      setNombreCompleto(userToEdit.nombre_completo);
      setRole(userToEdit.rol_id); // Asumiendo que viene rol_id o lo sacamos del rol objeto
      setPassword(''); // La contraseña no se muestra, se deja en blanco para no cambiarla

      // Ajuste por si el objeto userToEdit tiene la estructura anidada rol: { id_rol: 2 ... }
      if (userToEdit.rol && userToEdit.rol.id_rol) {
        setRole(userToEdit.rol.id_rol);
      } else if (userToEdit.rol_id) {
        setRole(userToEdit.rol_id);
      }
    } else {
      // Limpiar si entramos en modo crear
      setUsername('');
      setPassword('');
      setNombreCompleto('');
      setRole(ROLES[0].id);
    }
  }, [userToEdit, isEditing]);


  // **********************************************
  // LÓGICA DE CREACIÓN O EDICIÓN
  // **********************************************
  const handleSave = async () => {
    // Validaciones
    if (!username || !nombre_completo || !rolId) {
      Alert.alert('Error', 'Usuario, Nombre y Rol son obligatorios.');
      return;
    }
    // Si es nuevo, password obligatorio. Si edita, opcional.
    if (!isEditing && !password) {
      Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // --- MODO EDICIÓN (PATCH) ---
        const payload = {
          username,
          nombre_completo,
          rolId: Number(rolId)
        };
        // Solo mandamos password si el usuario escribió algo
        if (password.trim() !== '') {
          payload.password = password;
        }

        await axios.patch(`${API_BASE_URL}/auth/users/${userToEdit.id_usuario}`, payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        Alert.alert('Éxito', `Usuario actualizado correctamente.`);

      } else {
        // --- MODO CREACIÓN (POST) ---
        await axios.post(`${API_BASE_URL}/auth/register`,
          {
            username,
            password,
            nombre_completo,
            rolId: Number(rolId)
          },
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        Alert.alert('Éxito', `Usuario creado correctamente.`);
      }

      navigation.goBack();

    } catch (error) {
      console.error('Error al guardar usuario:', error);
      const message = error.response?.data?.message || 'Error de conexión.';
      Alert.alert('Error', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</Text>

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
          placeholder={isEditing ? "(Dejar en blanco para no cambiar)" : ""}
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
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UserCreationScreen;