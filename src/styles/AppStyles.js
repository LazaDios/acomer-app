import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Colores globales
const COLORS = {
  primary: '#007bff',    // Azul principal
  secondary: '#6c757d',  // Gris secundario
  success: '#28a745',    // Verde éxito
  danger: '#dc3545',     // Rojo peligro/error
  warning: '#ffc107',    // Amarillo advertencia
  background: '#f8f9fa', // Fondo gris claro
  white: '#fff',
  textDark: '#343a40',
  textLight: '#6c757d',
  border: '#ced4da',
};

export const styles = StyleSheet.create({
  // ** CONTENEDORES GENERALES **
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textDark,
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },

  // ** LOGIN **
  loginScreenContainer: { // Antes loginContainer
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loginBox: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainerLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    height: 50,
  },
  loginIcon: {
    marginRight: 10,
  },
  loginInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },

  // ** TÍTULOS Y TEXTOS **
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.textDark,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 5,
  },
  sectionTitleOperative: { 
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 15,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 5,
    marginTop: 10,
  },

  // ** BOTONES GENERALES **
  button: { // Botón grande principal
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonPrimary: { // Botón de acción rápida (ej. Crear Comanda)
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    elevation: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  smallButton: { // Botones pequeños en tarjetas
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    minWidth: 80,
  },
  smallButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingButton: { // Botón flotante (ej. +)
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 90, // Arriba del botón de cerrar sesión
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    elevation: 8,
    zIndex: 10,
  },

  // ** FORMULARIOS E INPUTS **
  formContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  inputContainer: { // Input genérico
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    marginLeft: 10,
  },
  inputContainerForm: { // Input simple para formularios
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: COLORS.white,
  },
  inputForm: {
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: COLORS.white,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
  },

  // ** TARJETAS DE COMANDA Y LISTADOS **
  orderCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.border,
    // borderLeftColor se sobreescribe dinámicamente en el componente
  },
  highlightedCard: {
    borderLeftColor: COLORS.warning, 
    backgroundColor: '#fffbe6', 
    shadowColor: COLORS.warning,
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  orderStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  orderStatusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderDetailText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },

  // ** EDITOR DE COMANDAS (CARRITO Y PRODUCTOS) **
  
  // Menú Horizontal
  productItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    margin: 5,
    width: 140,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  productButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 5,
  },
  productButtonPrice: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: 'bold',
  },

  // Sección "Productos en curso"
  existingItemsSection: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
  },
  existingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#faeecb',
    paddingBottom: 4,
  },
  existingItemText: {
    fontSize: 15,
    color: '#856404',
    flex: 1,
  },
  existingItemPrice: {
    fontWeight: 'bold',
    color: '#856404',
  },

  // Ítem del Carrito (Nuevos)
  cartItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    padding: 5,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: COLORS.textDark,
  },
  descriptionInput: { // Notas del producto
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    marginTop: 8,
    width: '95%',
    color: '#495057',
  },
  deleteButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },

  // ** ESTADOS VACÍOS **
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 10,
  },

  // ** MODALES (Cancelación, etc.) **
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.textDark,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.danger,
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
// Agrega esto en src/styles/AppStyles.js

  // --- ESTILOS PARA EL MENÚ DE ADMINISTRADOR (Tarjetas) ---
  adminGrid: {
    flexDirection: 'column', // Lista vertical
    gap: 15, // Espacio entre tarjetas
    marginTop: 10,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 4, // Sombra Android
    shadowColor: '#000', // Sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 6, // Borde de color a la izquierda
    // borderLeftColor se define en línea según el tipo
  },
  adminIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    // backgroundColor se define en línea (un tono suave del color principal)
  },
  adminTextContainer: {
    flex: 1,
  },
  adminCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  adminCardSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  // --- Nuevo estilo base para los botones del Admin ---
adminButtonBase: {
    marginVertical: 8, // Espacio arriba y abajo para separar los botones
    paddingHorizontal: 20, // Padding en los lados
},

// 1. Asegúrate de que este estilo se vea así para separar el texto de los botones
productAuditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10, // Para separar las tarjetas entre sí
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
},

// 2. Modifica el contenedor de las acciones
productAuditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto', // Esto empuja las acciones a la derecha
},

// 3. Modifica el estilo general para los botones de acción
actionButton: {
    padding: 8, // Aumentamos el padding interno para que sean más grandes y cliqueables
    borderRadius: 6,
    // El margen lateral se gestiona en línea en el componente
},
// ... otros estilos ...
summaryBox: {
        backgroundColor: '#e9ecef', // Un fondo claro para la caja
        padding: 15,
        borderRadius: 8,
        marginTop: 15,
        // Usamos columna para que la etiqueta y el valor no compitan por el ancho
        flexDirection: 'column', 
        alignItems: 'flex-start', // Alinea el contenido a la izquierda
    },
    summaryLabel: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 5,
        flexShrink: 1, // Permite que el texto se comprima si es necesario
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#007bff', // Color destacado para el total
        // Aseguramos que el valor monetario siempre tenga todo el espacio
        // Si el valor es lo que se sale, puedes reducir el tamaño de fuente aquí.
    },

});