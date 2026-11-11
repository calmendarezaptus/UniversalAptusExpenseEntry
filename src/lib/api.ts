// Función del proyecto Gastos (ExpensesForAptusFinancials): expense_services.
// Desarrollo usa el proxy de Vite (mismo origen); VITE_API_BASE_URL la reemplaza si se define.
const FALLBACK_API = 'https://expensesforaptusfinancials-730085095.development.catalystserverless.com/server/expense_services'
// Todas las llamadas pasan por aquí (en la captura de tiempos los catálogos tenían la URL fija).
export const API_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || FALLBACK_API).replace(/\/$/, '')

// A dónde regresa "Cancelar" si no llega ?origin= (calendario de gastos).
export const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL || 'https://universal-expenseentry-calendar.onslate.com/'
