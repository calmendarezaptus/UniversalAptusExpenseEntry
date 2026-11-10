// Función del proyecto Gastos: expense_services. Desarrollo usa el proxy de Vite (mismo origen).
// TRANSITORIO: mientras no exista la URL de expense_services, el respaldo es time_entry_services,
// que aún conserva las rutas de gastos. Reemplazar FALLBACK_API al desplegar la función nueva
// (o definir VITE_API_BASE_URL en la Slate).
const FALLBACK_API = 'https://timeentryforaptusfinancials-730085095.development.catalystserverless.com/server/time_entry_services'
// Todas las llamadas pasan por aquí (en la captura de tiempos los catálogos tenían la URL fija).
export const API_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || FALLBACK_API).replace(/\/$/, '')

// A dónde regresa "Cancelar" si no llega ?origin= (calendario de gastos).
export const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL || 'https://universal-expenseentry-calendar.onslate.com/'
