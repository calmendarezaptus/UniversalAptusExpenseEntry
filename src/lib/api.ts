// Desarrollo usa el proxy de Vite (mismo origen); producción usa la URL configurada.
// Todas las llamadas pasan por aquí (en la captura de tiempos los catálogos tenían la URL fija).
export const API_BASE = import.meta.env.DEV
  ? '/api/time-entry'
  : (import.meta.env.VITE_TIME_ENTRY_API_BASE_URL || 'https://timeentryforaptusfinancials-730085095.development.catalystserverless.com/server/time_entry_services').replace(/\/$/, '')

// A dónde regresa "Cancelar" si no llega ?origin= (calendario de gastos).
export const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL || 'https://universal-expenses-calendar.onslate.com/'
