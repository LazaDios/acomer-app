import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, createStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // Se añade Picker para la selección de rol
import { jwtDecode } from 'jwt-decode';

// --- 1. CONFIGURACIÓN DE LA API ---
// ***************************************************************
// !!! IMPORTANTE: CAMBIA 'TU_IP_LOCAL' POR LA IP DE TU PC !!!
// Por ejemplo: 'http://192.168.1.5:3000/auth'
const API_BASE_URL = 'http://192.168.10.107:3000/api/v1'; // Cambiamos a la base para usar /auth y /users
// ***************************************************************
const TOKEN_KEY = 'user_token';
const USER_ROLE_KEY = 'user_role';

// Mapeo de roles de la API a nombres de pantalla
const ROLE_SCREENS = {
  'administrador': 'AdminNavigator', // Cambiamos para usar un navegador anidado
  'cocinero': 'CamareroDashboard',
  'mesonero': 'MesoneroDashboard',
};

// Roles disponibles para la creación de usuarios
const AVAILABLE_ROLES = ['administrador', 'cocinero', 'mesonero'];

// --- 2. CONTEXTO DE AUTENTICACIÓN ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial (Intenta recuperar el token al iniciar la app)
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const role = await SecureStore.getItemAsync(USER_ROLE_KEY);
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error al cargar datos de almacenamiento:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // Función de Login
const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });

      // --- CAMBIO AQUÍ: Mapear la respuesta REAL de la API ---
      // Obtenemos el token desde 'access_token'
      const accessToken = response.data.access_token; 
      // Obtenemos el rol desde 'usuario.rol'
      const role = response.data.usuario.rol; 
      // --------------------------------------------------------

      if (accessToken && role) { 
        // ... (El resto de la lógica para guardar el token es la misma)
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_ROLE_KEY, role);
        
        setUserToken(accessToken);
        setUserRole(role);
        Alert.alert('Éxito', 'Inicio de sesión exitoso. Redirigiendo...');
      } else {
        Alert.alert('Error', 'Respuesta de la API incompleta: token o rol no recibidos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      const message = error.response?.data?.message || 'Error de conexión o credenciales inválidas.';
      Alert.alert('Error de Login', message);
      setUserToken(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Logout
  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
    setUserToken(null);
    setUserRole(null);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- 3. PANTALLA DE LOGIN ---
const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = () => {
    if (username && password) {
      login(username, password); 
    } else {
      Alert.alert('Atención', 'Por favor, ingrese usuario y contraseña.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acomer | Iniciar Sesión</Text>
      
      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={24} color="#333" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="#333" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};


// --- 4. FUNCIONALIDADES DE ADMINISTRADOR ---

// Componente para crear nuevos usuarios
const UserCreationScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(AVAILABLE_ROLES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userToken } = useContext(AuthContext);
  const navigation = useNavigation();

  const createUser = async () => {
    if (!username || !password || !role) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Intentamos crear el usuario
      await axios.post(`${API_BASE_URL}/users`, // Ruta de creación de usuarios en NestJS
        { username, password, roles: [role] },
        {
          headers: {
            Authorization: `Bearer ${userToken}`, // Se envía el token de admin
          },
        }
      );

      Alert.alert('Éxito', `Usuario '${username}' creado con el rol: ${role}.`);
      // Limpiar formulario y volver
      setUsername('');
      setPassword('');
      setRole(AVAILABLE_ROLES[0]);
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

      {/* Selector de Rol */}
      <Text style={styles.label}>Rol:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue)}
          style={styles.picker}
        >
          {AVAILABLE_ROLES.map((r) => (
            <Picker.Item key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} value={r} />
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


// Pantalla Principal del Administrador
const AdminMainScreen = ({ navigation }) => (
  <View style={styles.dashboardContainer}>
    <Text style={styles.dashboardTitle}>Panel de Administración</Text>
    <Text style={styles.infoText}>Opciones Rápidas:</Text>
    
    <TouchableOpacity 
      style={[styles.dashboardButton, { backgroundColor: '#28a745' }]} 
      onPress={() => navigation.navigate('UserCreation')}
    >
      <MaterialIcons name="person-add" size={24} color="#fff" />
      <Text style={styles.dashboardButtonText}>Crear Nuevo Usuario</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.dashboardButton, { backgroundColor: '#007bff' }]} 
      onPress={() => Alert.alert('Función Pendiente', 'Implementaremos la gestión de productos aquí.')}
    >
      <MaterialIcons name="restaurant-menu" size={24} color="#fff" />
      <Text style={styles.dashboardButtonText}>Gestión de Productos</Text>
    </TouchableOpacity>

    <Text style={styles.infoText}>Aquí programaremos el CRUD completo.</Text>

    <DashboardBase>
      {/* El botón de Logout se renderiza desde DashboardBase */}
    </DashboardBase>
  </View>
);

// Navegador Anidado para el Administrador
const AdminStack = createNativeStackNavigator();

const AdminNavigator = () => (
  <AdminStack.Navigator screenOptions={{ 
      headerShown: true,
      headerStyle: { backgroundColor: '#007bff' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <AdminStack.Screen 
      name="AdminMain" 
      component={AdminMainScreen} 
      options={{ title: 'Admin Principal' }} 
    />
    <AdminStack.Screen 
      name="UserCreation" 
      component={UserCreationScreen} 
      options={{ title: 'Crear Usuario' }} 
    />
  </AdminStack.Navigator>
);


// --- 5. PANTALLAS DE OTROS DASHBOARD (Simuladas) ---

// Dashboard Base para los botones de Logout
const DashboardBase = ({ children }) => {
  const { logout } = useContext(AuthContext);
  return (
    <View style={styles.dashboardBaseFooter}>
      {children}
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={logout}
      >
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const CamareroDashboard = () => (
  <View style={styles.dashboardContainer}>
    <Text style={styles.dashboardTitle}>Dashboard COCINERO </Text>
    <Text style={styles.infoText}>Modificar el status del pedido.</Text>
    <DashboardBase />
  </View>
);

const MesoneroDashboard = () => (
  <View style={styles.dashboardContainer}>
    <Text style={styles.dashboardTitle}>Dashboard Mesonero</Text>
    <Text style={styles.infoText}>Tienes permisos para crear nuevas órdenes. (atender a los clientes)</Text>
    <DashboardBase />
  </View>
);


// --- 6. NAVEGACIÓN CONDICIONAL PRINCIPAL ---
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <Stack.Screen 
          name={ROLE_SCREENS[userRole] || 'AdminNavigator'}
          component={
            userRole === 'administrador' 
              ? AdminNavigator 
              : userRole === 'cocinero' 
                ? CamareroDashboard 
                : MesoneroDashboard
          } // <--- Sintaxis ternaria corregida
        />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};


// --- ESTRUCTURA PRINCIPAL DE LA APLICACIÓN ---
export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}

// --- ESTILOS (Estilos básicos para React Native) ---
const styles = StyleSheet.create({
  // Estilos de Carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  // Estilos de Login
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: { // Estilos para Login
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  // Estilos de Botones
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginTop: 20,
    width: '100%',
  },
  // Estilos de Dashboard
  dashboardContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingTop: 50,
  },
  dashboardBaseFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Estilos de Formulario (User Creation)
  formContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  inputContainerForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  inputForm: {
    height: 45,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 45,
    width: '100%',
  }
});