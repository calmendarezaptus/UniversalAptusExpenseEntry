import { API_BASE } from './api'

export type ExpenseTipo = 'gasto' | 'reembolso'
export type PagadoPor = 'despacho' | 'caja_chica' | 'abogado'

export const TIPO_LABEL: Record<ExpenseTipo, string> = { gasto: 'Gasto', reembolso: 'Reembolso' }
export const PAGADO_POR_LABEL: Record<PagadoPor, string> = { despacho: 'Despacho', caja_chica: 'Caja chica', abogado: 'Abogado' }

export interface ExpensePayload {
  proyecto_id: number; fecha: string; monto: number; descripcion: string
  categoria_id: number | null; tipo: ExpenseTipo; facturable: boolean
  pagado_por: PagadoPor; abogado_id: number | null
}

// Lo que devuelve ReportesSandbox para un gasto (campos que usa la interfaz).
export interface Expense {
  id: number; proyecto_id: number; fecha: string; monto: number; moneda: string; descripcion: string | null
  categoria_id: number | null; categoria_nombre?: string | null; tipo: ExpenseTipo; facturable: number
  pagado_por: PagadoPor; abogado_id: number | null; abogado_nombre?: string | null
  reembolso_estado?: 'pendiente' | 'reembolsado' | null
  liberado: number; prebill_id: number | null; facturado: number; status: string; cliente_zoho_id: string
}

const intId = (value: string | null | undefined) => value && /^\d+$/.test(value) ? Number(value) : null

// Acepta "1234.5", "1,234.50" o "1234". Máximo 2 decimales, sin redondear en silencio.
export function parseAmount(value: string): number {
  const clean = value.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) throw new Error('El monto debe ser un número con hasta 2 decimales.')
  const amount = Number(clean)
  if (!(amount > 0)) throw new Error('El monto debe ser mayor que cero.')
  return amount
}

export function formatAmount(value: number, moneda = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + (moneda ? ' ' + moneda : '')
}

export function buildExpense(input: {
  projectId?: string | null; date: string; amount: string; description: string
  categoryId?: string | null; tipo: string; facturable: boolean; pagadoPor: string; abogadoId?: string | null
}): ExpensePayload {
  const proyecto_id = intId(input.projectId)
  if (!proyecto_id) throw new Error('Selecciona un proyecto.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0, 10) !== input.date) throw new Error('Selecciona una fecha válida.')
  const monto = parseAmount(input.amount)
  if (input.tipo !== 'gasto' && input.tipo !== 'reembolso') throw new Error('Selecciona si es gasto o reembolso.')
  if (!['despacho', 'caja_chica', 'abogado'].includes(input.pagadoPor)) throw new Error('Selecciona quién pagó el gasto.')
  const abogado_id = intId(input.abogadoId)
  if (input.pagadoPor === 'abogado' && !abogado_id) throw new Error('Selecciona el abogado que pagó el gasto.')
  return {
    proyecto_id, fecha: input.date, monto, descripcion: input.description.trim(),
    categoria_id: intId(input.categoryId), tipo: input.tipo, facturable: input.facturable,
    pagado_por: input.pagadoPor as PagadoPor, abogado_id,
  }
}

type Uncertain = Error & { uncertain?: boolean }

export async function saveExpense(organizationId: string, payload: ExpensePayload, expenseId?: string): Promise<Expense> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/${encodeURIComponent(organizationId)}/gastos${expenseId ? `/${encodeURIComponent(expenseId)}` : ''}`, {
      method: expenseId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    })
  } catch {
    throw Object.assign(new Error('Se perdió la respuesta. Revisa el listado de gastos antes de repetir el guardado.'), { uncertain: true }) as Uncertain
  }
  const data = await response.json().catch(() => null)
  // Un 4xx sin JSON (p. ej. la función desplegada no tiene la ruta) no se procesó: es reintentable.
  if (!response.ok && !data && response.status >= 400 && response.status < 500) {
    throw Object.assign(new Error(response.status === 404
      ? 'La función de Catalyst no tiene la ruta de gastos (HTTP 404). Despliega la versión actual de time_entry_services.'
      : `El servidor rechazó la petición (HTTP ${response.status}).`), { uncertain: false }) as Uncertain
  }
  if (!response.ok || !Number.isInteger(data?.id)) {
    const uncertain = data?.outcome_unknown === true || !data?.stage || (response.ok && !Number.isInteger(data?.id))
    throw Object.assign(new Error(`${data?.error || 'No se pudo confirmar el guardado.'}${uncertain ? ' Revisa el listado de gastos antes de repetir el guardado.' : ''}`), { uncertain }) as Uncertain
  }
  return data as Expense
}

export async function getExpense(organizationId: string, expenseId: string, signal: AbortSignal): Promise<Expense> {
  if (!/^\d+$/.test(expenseId)) throw new Error('El parámetro gasto_id no es válido.')
  const response = await fetch(`${API_BASE}/${encodeURIComponent(organizationId)}/gastos/${encodeURIComponent(expenseId)}`, { signal })
  const data = await response.json().catch(() => null)
  if (!response.ok || data?.id !== Number(expenseId)) throw new Error(data?.error || 'No se pudo cargar el gasto. Comprueba que Catalyst esté actualizado.')
  if (typeof data.monto !== 'number' || !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha) || !Number.isInteger(data.proyecto_id)) throw new Error('El gasto recibido tiene un formato inesperado.')
  return data as Expense
}

// La API rechaza (409) editar lo que ya está en una Prebill o facturado; se avisa antes.
export function lockReason(expense: Pick<Expense, 'facturado' | 'prebill_id' | 'status'>): string | null {
  if (expense.facturado === 1 || expense.status === 'facturado') return 'Este gasto ya está facturado y no se puede editar.'
  if (expense.prebill_id != null || expense.status === 'en_prebill') return `Este gasto ya está en la Prebill #${expense.prebill_id}. Quítalo de la Prebill para editarlo.`
  return null
}
