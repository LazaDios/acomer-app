import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // ** Contenedores Generales **
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#343a40',
  },
  
  // ** ESTILOS DE LOGIN (NUEVOS) **
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff', // Fondo blanco para el formulario de login
  },
  loginBox: {
    width: '100%',
    maxWidth: 400, // Limita el ancho en pantallas grandes para que no se vea "muy ancho"
    padding: 25,
    borderRadius: 10,
    backgroundColor: '#f8f9fa', // Un color levemente distinto para el contenedor
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30,
    textAlign: 'center',
  },


  // ** ESTILOS DE DASHBOARD (Ajustados para evitar el "muy ancho") **
  dashboardContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
    paddingBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 10,
  },
  emptyTextSmall: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  
  // ** Componentes de Botones **
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#007bff', // Azul primario
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ** Estilos de Formulario (Usados en LoginScreen, UserCreationScreen y ProductFormScreen) **
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 5,
    marginTop: 10,
  },
  inputContainerForm: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff', // Fondo blanco puro para inputs
  },
  inputForm: {
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  
  // ** Estilos para Listado de Productos **
  productAuditCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#007bff', 
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  productAuditInfo: {
    flex: 1,
  },
  productAuditActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  productDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 3,
  },

  // ** Estilos para Toma de Pedidos **
  productListContainer: {
    flex: 1,
    marginTop: 10,
  },
  orderItemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 10,
    marginTop: 15,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    padding: 10,
    borderRadius: 5,
  },
  cartQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    width: 25,
    textAlign: 'center',
    color: '#343a40',
  },
  orderSummary: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 10,
  },
  summaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 15,
    textAlign: 'right',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ** Estilos de Pedidos de Cocina **
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    marginBottom: 15,
  },
  refreshButtonText: {
    marginLeft: 5,
    color: '#007bff',
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
  },
  orderStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderDetailText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 3,
  },
  orderItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginTop: 8,
    marginBottom: 5,
  },
  orderItemText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#495057',
  },
  orderActions: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'flex-end',
  },
  loginScreenContainer: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco limpio
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'center',     // Centra el contenido horizontalmente
    padding: 30,
},
loginBox: {
    width: '100%',
    maxWidth: 400, // Limita el ancho en tabletas o dispositivos grandes
    padding: 30,
    borderRadius: 12,
    backgroundColor: '#f8f9fa', // Un fondo suave para el formulario (efecto tarjeta)
    elevation: 8, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
},
loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff', // Color primario
    marginBottom: 30,
    textAlign: 'center',
},
inputContainerLogin: { // Nuevo estilo para el contenedor de input + icono
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    height: 50,
},
loginIcon: { // Estilo para el ícono de MaterialIcons
    marginRight: 10,
},
loginInput: {
    flex: 1, // Hace que el TextInput ocupe el espacio restante
    fontSize: 16,
    color: '#343a40',
},
// Añadir a src/styles/AppStyles.js

// ... (después de summaryValue, antes de productListContainer, o donde prefieras)

// Estilos de Auditoría de Comandas - Fechas
dateFilterContainer: {
  marginBottom: 15,
  padding: 10,
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#eee',
  elevation: 1,
},
datePickerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
dateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#e9f5ff', // Azul muy claro
  padding: 10,
  borderRadius: 5,
  width: '48%', // Para que quepan dos en una fila
  justifyContent: 'center',
},
dateButtonText: {
  marginLeft: 5,
  color: '#007bff',
  fontWeight: '600',
},
pickerContainer: { // Estilo para el contenedor del Picker de estado
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#fff',
    height: 50,
    justifyContent: 'center',
},
picker: {
    height: 50,
    width: '100%',
},

// ...
});