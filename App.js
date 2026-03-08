// App.js
import React, { Component } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// 1. Capturador de Errores Global (Evita que la app se cierre por errores de JS no manejados)
const defaultErrorHandler = global.ErrorUtils?.getGlobalHandler();
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🚨 [CRASH LOCALIZADO] ERROR FATAL:', error.message);
    console.error('🚨 [STACK TRACE]:', error.stack);

    // Forzamos una alerta para que el usuario pueda ver el error antes de que se cierre
    Alert.alert(
      "Algo salió mal (JS Error)",
      `${error.message}\n\n${isFatal ? "La app podría cerrarse." : "Puedes intentar seguir."}`,
      [{ text: "OK" }]
    );

    if (defaultErrorHandler) {
      defaultErrorHandler(error, isFatal);
    }
  });
}

// Promesas no capturadas
if (global.Promise) {
  const originalRejectionHandler = global.onunhandledrejection;
  global.onunhandledrejection = (error) => {
    console.warn('⚠️ [UNHANDLED PROMISE]:', error);
    if (originalRejectionHandler) {
      originalRejectionHandler(error);
    }
  };
}

// 2. Componente de Frontera de Error (Muestra una pantalla en vez de cerrarse)
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 [REACT CRASH DETECTADO]:', error);
    console.error('💥 [INFO DEL COMPONENTE]:', errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8d7da', padding: 20, justifyContent: 'center' }}>
          <ScrollView>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#721c24', marginBottom: 10 }}>
              ⚠️ Crash Evitado
            </Text>
            <Text style={{ color: '#721c24', marginBottom: 20 }}>
              La aplicación encontró un error crítico en lugar de cerrarse. Por favor, toma una captura e informa al desarrollador.
            </Text>

            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Mensaje de Error:</Text>
            <Text style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 }}>
              {this.state.error?.message?.toString()}
            </Text>

            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Traza (Stack):</Text>
            <Text style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, fontSize: 10 }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack}
            </Text>

            <TouchableOpacity
              style={{ backgroundColor: '#721c24', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' }}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Intentar Continuar</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}