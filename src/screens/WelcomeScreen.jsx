import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

const WelcomeScreen = ({ navigation }) => {
    const { registerRestaurant, activateRestaurant, isLoading } = useContext(AuthContext);

    const [showRegister, setShowRegister] = useState(true);

    // Estados para registro
    const [restaurantName, setRestaurantName] = useState('');
    const [username, setUsername] = useState('');
    // const [cedula, setCedula] = useState(''); // REMOVED
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Estados para login existente
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleRegister = () => {
        if (!restaurantName || !username || !email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }
        registerRestaurant({
            restaurantName,
            username,
            // cedula, // REMOVED
            email,
            password
        });
    };

    const handleExistingLogin = () => {
        if (!loginUsername || !loginPassword) {
            Alert.alert('Error', 'Por favor ingresa tus credenciales');
            return;
        }
        // login(loginUsername, loginPassword);
        // Ahora usamos activateRestaurant para ir al "segundo login"
        activateRestaurant(loginUsername, loginPassword);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png' }}
                            style={styles.logo}
                        />
                        <Text style={styles.title}>Bienvenido a Acomer</Text>
                        <Text style={styles.subtitle}>
                            {showRegister ? 'Registra tu restaurante para comenzar' : 'Ingresa con tu cuenta existente'}
                        </Text>
                    </View>

                    {showRegister ? (
                        // FORMULARIO DE REGISTRO
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre del Restaurante</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Restaurante El Buen Sabor"
                                    value={restaurantName}
                                    onChangeText={setRestaurantName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre de Usuario (Admin)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. usuario_admin"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </View>



                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Correo Electrónico</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="juan@gmail.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="********"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Registrar Restaurante</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => setShowRegister(false)}
                            >
                                <Text style={styles.loginLinkText}>¿Ya tienes un restaurante? Inicia Sesión</Text>
                            </TouchableOpacity>

                        </View>
                    ) : (
                        // FORMULARIO DE LOGIN EXISTENTE
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Usuario (ej. admin_5)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="admin_5"
                                    autoCapitalize="none"
                                    value={loginUsername}
                                    onChangeText={setLoginUsername}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="admin"
                                    secureTextEntry
                                    value={loginPassword}
                                    onChangeText={setLoginPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleExistingLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Continuar</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => setShowRegister(true)}
                            >
                                <Text style={styles.loginLinkText}>¿No tienes restaurante? Regístrate</Text>
                            </TouchableOpacity>

                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    registerButton: {
        backgroundColor: '#FF4B3A',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#FF4B3A',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default WelcomeScreen;
