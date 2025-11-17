import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; 
import { AuthContext } from '../../contexts/AuthContext';
import { styles } from '../../styles/AppStyles'; 

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
    // CAMBIAR styles.container por styles.loginScreenContainer
    <View style={styles.loginScreenContainer}>
        
        {/* ENVOLVER TODO EL FORMULARIO EN styles.loginBox */}
        <View style={styles.loginBox}>

            {/* CAMBIAR styles.title por styles.loginTitle */}
            <Text style={styles.loginTitle}>Acomer | Iniciar Sesión</Text>
            
            {/* CAMBIAR styles.inputContainer por styles.inputContainerLogin */}
            <View style={styles.inputContainerLogin}>
                {/* CAMBIAR styles.icon por styles.loginIcon */}
                <MaterialIcons name="person" size={24} color="#343a40" style={styles.loginIcon} />
                <TextInput
                    // CAMBIAR styles.input por styles.loginInput
                    style={styles.loginInput}
                    placeholder="Usuario"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>

            {/* Repetir para el campo de Contraseña */}
            <View style={styles.inputContainerLogin}>
                <MaterialIcons name="lock" size={24} color="#343a40" style={styles.loginIcon} />
                <TextInput
                    style={styles.loginInput}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {/* Usar styles.button, que ya está definido globalmente */}
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
    </View>
);
};

export default LoginScreen;