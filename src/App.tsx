import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import 'animate.css'
import { Toaster } from 'sonner'
import {
  Ban, Briefcase, Calendar as CalendarIcon, FileText, Info, Percent, Receipt, RefreshCw,
  RotateCcw, Save, Settings2, Tag, User, Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusModal, type StatusModalType } from '@/components/StatusModal'
import { SearchSelect } from '@/components/SearchSelect'
import { ThemeMenu } from '@/components/ThemeMenu'
import { DescriptionCard } from '@/components/DescriptionCard'
import { AmountPopover } from '@/components/AmountPopover'
import { cn } from '@/lib/utils'
import { CALENDAR_URL } from '@/lib/api'
import { cardCls, gradientBtnCls, labelCls, sectionIconCls, sectionTitleCls, useTheme } from '@/lib/ui'
import { loadAbogados, loadCategorias, loadClientes, loadProyectos, type Abogado, type Categoria, type Cliente, type Proyecto } from '@/lib/catalogs'
import {
  buildExpense, formatAmount, getExpense, lockReason, PAGADO_POR_LABEL, saveExpense,
  type Expense, type ExpenseTipo, type PagadoPor,
} from '@/lib/expense'

type Modal = { isOpen: boolean; type: StatusModalType; title: string; message: string }
type Loadable<T> = { rows: T[]; loading: boolean; error: string }
const empty = <T,>(): Loadable<T> => ({ rows: [], loading: false, error: '' })

function useCatalog<T>(org: string | null, loader: (org: string, force?: boolean) => Promise<T[]>, label: string) {
  const [state, setState] = useState<Loadable<T>>(empty)
  const load = async (force = false) => {
    if (!org) return
    setState(s => ({ ...s, loading: true, error: '' }))
    try { setState({ rows: await loader(org, force), loading: false, error: '' }) }
    catch { setState({ rows: [], loading: false, error: `No se pudieron cargar ${label}.` }) }
  }
  useEffect(() => { void load() }, [org]) // eslint-disable-line react-hooks/exhaustive-deps
  return [state, load] as const
}

function App() {
  const [theme, setTheme] = useTheme()
  const [editId] = useState(() => new URLSearchParams(window.location.search).get('gasto_id'))
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [statusModal, setStatusModal] = useState<Modal>({ isOpen: false, type: 'info', title: '', message: '' })

  useEffect(() => {
    const orgId = new URLSearchParams(window.location.search).get('organization_id')
    if (!orgId) setStatusModal({ isOpen: true, type: 'error', title: 'Error de Inicialización', message: 'No se detectó la organización relacionada. Es necesario incluir el parámetro "organization_id" en la URL.' })
    else setOrganizationId(orgId)
  }, [])

  const [clientes, reloadClientes] = useCatalog<Cliente>(organizationId, loadClientes, 'los clientes')
  const [proyectos, reloadProyectos] = useCatalog<Proyecto>(organizationId, loadProyectos, 'los proyectos')
  const [abogados, reloadAbogados] = useCatalog<Abogado>(organizationId, loadAbogados, 'los abogados')
  const [categorias, reloadCategorias] = useCatalog<Categoria>(organizationId, loadCategorias, 'las categorías de gasto')

  // Formulario
  const [date, setDate] = useState<Date>(new Date())
  const [selectedCliente, setSelectedCliente] = useState('')
  const [selectedProyecto, setSelectedProyecto] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [tipo, setTipo] = useState<ExpenseTipo>('gasto')
  const tipoTouched = useRef(false)
  const [facturable, setFacturable] = useState(true)
  const [pagadoPor, setPagadoPor] = useState<PagadoPor>('despacho')
  const [selectedAbogado, setSelectedAbogado] = useState('')
  const [amount, setAmount] = useState('0.00')
  const [description, setDescription] = useState('')

  // Guardado
  const [isSaving, setIsSaving] = useState(false)
  const [saveBlocked, setSaveBlocked] = useState(false)
  const savingRef = useRef(false)
  const savedFingerprint = useRef('')

  // Edición
  const [editDetail, setEditDetail] = useState<Expense | null>(null)
  const [editError, setEditError] = useState('')
  const [editReady, setEditReady] = useState(false)

  const proyectosCliente = useMemo(() => proyectos.rows.filter(p => p.cliente_id === selectedCliente), [proyectos.rows, selectedCliente])
  const proyecto = proyectos.rows.find(p => p.ID === selectedProyecto)
  const moneda = proyecto?.moneda || editDetail?.moneda || 'MXN'
  const catalogsLoading = clientes.loading || proyectos.loading || abogados.loading || categorias.loading

  // La categoría propone el tipo (gasto / reembolso) mientras el usuario no lo haya elegido a mano.
  useEffect(() => {
    const categoria = categorias.rows.find(c => c.ID === selectedCategoria)
    if (categoria?.tipo && !tipoTouched.current) setTipo(categoria.tipo)
  }, [selectedCategoria, categorias.rows])

  useEffect(() => {
    if (editId === null || !organizationId) return
    const controller = new AbortController()
    getExpense(organizationId, editId, controller.signal)
      .then(detail => { if (!controller.signal.aborted) setEditDetail(detail) })
      .catch(error => { if (!controller.signal.aborted) setEditError(error instanceof Error ? error.message : 'No se pudo cargar el gasto.') })
    return () => controller.abort()
  }, [editId, organizationId])

  useEffect(() => {
    if (!editDetail || editReady || catalogsLoading || !proyectos.rows.length) return
    const project = proyectos.rows.find(p => p.ID === String(editDetail.proyecto_id))
    if (!project || !clientes.rows.some(c => c.ID === project.cliente_id)) { setEditError('El proyecto o cliente de este gasto no está disponible en Aptus Sync.'); return }
    if (editDetail.abogado_id != null && !abogados.rows.some(a => a.ID === String(editDetail.abogado_id))) { setEditError('El abogado de este gasto no está disponible en el catálogo activo de Aptus Sync.'); return }
    setSelectedCliente(project.cliente_id)
    setSelectedProyecto(project.ID)
    setSelectedCategoria(editDetail.categoria_id == null ? '' : String(editDetail.categoria_id))
    tipoTouched.current = true
    setTipo(editDetail.tipo)
    setFacturable(editDetail.facturable === 1)
    setPagadoPor(editDetail.pagado_por)
    setSelectedAbogado(editDetail.abogado_id == null ? '' : String(editDetail.abogado_id))
    setAmount(editDetail.monto.toFixed(2))
    setDescription(editDetail.descripcion || '')
    const [y, m, d] = editDetail.fecha.split('-').map(Number)
    setDate(new Date(y, m - 1, d))
    const locked = lockReason(editDetail)
    if (locked) setEditError(locked)
    setEditReady(true)
  }, [editDetail, editReady, catalogsLoading, proyectos.rows, clientes.rows, abogados.rows])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isSaving) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isSaving])

  const editing = editId !== null
  const editBlocked = editing && (!editReady || !!editError)

  async function handleSave() {
    if (savingRef.current || saveBlocked || editBlocked) return
    try {
      if (!organizationId || !/^\d+$/.test(organizationId)) throw new Error('Falta una organización válida.')
      if (!selectedCliente) throw new Error('Selecciona un cliente.')
      const payload = buildExpense({
        projectId: selectedProyecto, date: format(date, 'yyyy-MM-dd'), amount, description,
        categoryId: selectedCategoria, tipo, facturable, pagadoPor, abogadoId: selectedAbogado,
      })
      const fingerprint = JSON.stringify([organizationId, editId, payload])
      if (savedFingerprint.current === fingerprint) throw new Error('Estos datos ya se guardaron. Modifica los campos para registrar un gasto nuevo.')
      savingRef.current = true
      setIsSaving(true)
      const saved = await saveExpense(organizationId, payload, editId ?? undefined)
      savedFingerprint.current = fingerprint
      setStatusModal({
        isOpen: true, type: 'success', title: editing ? 'Gasto actualizado' : 'Gasto guardado',
        message: `Se guardó el gasto #${saved.id} por ${formatAmount(saved.monto, saved.moneda)}.${saved.reembolso_estado === 'pendiente' ? ' Quedó un reembolso pendiente para el abogado.' : ''}`,
      })
    } catch (error) {
      const uncertain = error instanceof Error && 'uncertain' in error && (error as { uncertain?: boolean }).uncertain === true
      if (uncertain) setSaveBlocked(true)
      setStatusModal({ isOpen: true, type: 'error', title: uncertain ? 'Guardado por verificar' : 'No se completó el guardado', message: error instanceof Error ? error.message : 'Error al guardar.' })
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  function handleCancel() {
    const params = new URLSearchParams(window.location.search)
    const org = organizationId || params.get('organization_id') || ''
    try {
      const target = new URL(params.get('origin') || CALENDAR_URL)
      if (!target.searchParams.get('organization_id') && org) target.searchParams.set('organization_id', org)
      target.searchParams.set('_t', Date.now().toString())
      window.location.href = target.toString()
    } catch {
      window.location.href = `${CALENDAR_URL}?organization_id=${encodeURIComponent(org)}&_t=${Date.now()}`
    }
  }

  const amountNumber = Number(amount) || 0
  const stripIcon = 'w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/25'
  const divider = <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-white/20 hidden md:block"></div>

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 sm:p-4 lg:p-8 flex justify-center items-start font-sans w-full">
      <Toaster position="top-center" richColors />
      <Card className="w-full bg-gradient-to-b from-[#FFFAFA] to-white border border-slate-200 rounded-[20px] overflow-hidden p-3 sm:p-5 lg:p-8 relative animate__animated animate__fadeIn animate__faster">

        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-theme-from/5 rounded-full blur-[80px] animate-blob pointer-events-none z-0"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-theme-to/5 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-theme-from/5 rounded-full blur-[80px] animate-blob animation-delay-4000 pointer-events-none z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-15 bg-gradient-to-b from-theme-light to-transparent pointer-events-none z-0"></div>

        {/* ── ENCABEZADO ─────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 lg:mb-8 gap-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-theme-from to-theme-to flex items-center justify-center shrink-0 shadow-sm border border-black/5 text-white">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{editing ? 'Editar gasto' : 'Registro de Gastos'}</h1>
                <ThemeMenu theme={theme} setTheme={setTheme} />
              </div>
              <p className="text-slate-500 text-sm mt-0.5">Captura de gastos y reembolsos por proyecto</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
            <Button variant="outline" type="button" onClick={handleCancel}
              className="flex-1 lg:flex-none lg:w-auto h-11 sm:h-12 px-6 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium">
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={editBlocked || isSaving || saveBlocked || catalogsLoading || !organizationId}
              className={cn('flex-1 lg:flex-none lg:w-auto h-11 sm:h-12 px-6 rounded-lg shadow-sm font-medium flex items-center justify-center gap-2 border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed', gradientBtnCls)}>
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando…' : saveBlocked ? 'Verificar en el listado' : editing ? 'Guardar cambios' : 'Guardar Gasto'}
            </Button>
          </div>
        </div>

        {editing && !editReady && !editError && (
          <div role="status" aria-live="polite" className="relative z-10 mb-4 flex items-center gap-3 rounded-xl border border-theme-border bg-theme-light/60 p-4 text-sm text-theme-text">
            <RefreshCw aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none" />
            <span>Cargando gasto…</span>
          </div>
        )}
        {editing && editError && <p role="alert" className="relative z-10 mb-4 text-sm text-red-700">{editError}</p>}
        {saveBlocked && <p role="status" className="relative z-10 mb-4 text-sm text-slate-600">La respuesta del guardado no pudo confirmarse. Revisa el listado de gastos antes de recargar para continuar.</p>}
        {[clientes, proyectos, abogados, categorias].filter(c => c.error).map(c => (
          <p key={c.error} role="alert" className="relative z-10 mb-2 text-xs text-red-700">{c.error}</p>
        ))}

        <div inert={isSaving || editBlocked} aria-busy={isSaving} className="space-y-4 relative z-10">

          {/* ── Fecha, categoría, cliente y proyecto ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className={cn(cardCls, 'flex flex-col')}>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className={sectionIconCls} />
                <span className={sectionTitleCls}>Información general</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div className="space-y-2 min-w-0">
                  <Label className={labelCls}>Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-left font-normal border-slate-200 bg-white hover:bg-slate-50 transition-all h-9 rounded-lg text-sm">
                        <span className="text-slate-900 font-medium">{format(date, 'yyyy-MM-dd')}</span>
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0 bg-white shadow-xl rounded-xl border-slate-200 data-[state=open]:animate-[fadeInDown_0.3s_ease-out] data-[state=closed]:animate-[fadeOutUp_0.3s_ease-in]" align="start">
                      <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} />
                    </PopoverContent>
                  </Popover>
                </div>
                <SearchSelect label="Categoría" icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
                  options={categorias.rows} value={selectedCategoria} onChange={setSelectedCategoria}
                  loading={categorias.loading} placeholder="Seleccionar categoría" searchPlaceholder="Buscar categoría..."
                  emptyText="No se encontraron categorías." onRefresh={() => void reloadCategorias(true)} />
              </div>
            </div>

            <div className={cn(cardCls, 'flex flex-col')}>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className={sectionIconCls} />
                <span className={sectionTitleCls}>Identificación</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 gap-y-4 flex-1">
                <SearchSelect label="Cliente *" icon={<Briefcase className="w-3.5 h-3.5 text-slate-400" />}
                  options={clientes.rows} value={selectedCliente}
                  onChange={id => { setSelectedCliente(id); setSelectedProyecto('') }}
                  loading={clientes.loading} disabled={editing} disabledText={clientes.rows.find(c => c.ID === selectedCliente)?.display}
                  placeholder="Seleccionar cliente" searchPlaceholder="Buscar cliente..." emptyText="No se encontraron clientes."
                  onRefresh={editing ? undefined : () => void reloadClientes(true)} />
                <SearchSelect label="Proyecto *" icon={<FileText className="w-3.5 h-3.5 text-slate-400" />}
                  options={proyectosCliente} value={selectedProyecto} onChange={setSelectedProyecto}
                  loading={proyectos.loading} disabled={!selectedCliente || editing}
                  disabledText={editing ? proyecto?.display : 'Selecciona un cliente primero'}
                  placeholder="Seleccionar proyecto" searchPlaceholder="Buscar proyecto..." emptyText="No se encontraron proyectos."
                  onRefresh={editing ? undefined : () => void reloadProyectos(true)} />
              </div>
              {editing && <p className="mt-3 text-xs text-slate-500">El proyecto no se puede cambiar: define la moneda del gasto.</p>}
            </div>
          </div>

          {/* ── Quién pagó y tipo ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className={cn(cardCls, 'lg:col-span-2 flex flex-col')}>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className={sectionIconCls} />
                <span className={sectionTitleCls}>Asignación</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 gap-y-4 flex-1">
                <div className="space-y-2 min-w-0">
                  <Label className={cn(labelCls, 'flex items-center gap-1.5 ml-1')}>
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    Pagado por *
                  </Label>
                  <Select value={pagadoPor} onValueChange={v => setPagadoPor(v as PagadoPor)}>
                    <SelectTrigger className="border-slate-200 bg-white hover:bg-slate-50 transition-all h-9 rounded-lg text-slate-700 font-medium text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-md border-slate-100">
                      {(Object.keys(PAGADO_POR_LABEL) as PagadoPor[]).map(k => <SelectItem key={k} value={k}>{PAGADO_POR_LABEL[k]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {pagadoPor === 'abogado' && <p className="text-xs text-slate-500">Se registrará un reembolso pendiente para el abogado.</p>}
                </div>
                <SearchSelect label={pagadoPor === 'abogado' ? 'Abogado *' : 'Abogado (opcional)'} icon={<User className="w-3.5 h-3.5 text-slate-400" />}
                  options={abogados.rows} value={selectedAbogado} onChange={setSelectedAbogado} withAvatar
                  loading={abogados.loading} placeholder="Seleccionar abogado" searchPlaceholder="Buscar abogado..."
                  emptyText="No se encontraron abogados." onRefresh={() => void reloadAbogados(true)} />
              </div>
            </div>

            <div className={cn(cardCls, 'md:col-span-1 flex flex-col')}>
              <div className="flex items-center gap-2 mb-4">
                <Receipt className={sectionIconCls} />
                <span className={sectionTitleCls}>Tipo de cargo</span>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 flex-1">
                {([
                  { key: 'gasto', label: 'Gasto', hint: 'Con IVA', Icon: Receipt },
                  { key: 'reembolso', label: 'Reembolso', hint: 'Sin IVA', Icon: RotateCcw },
                ] as const).map(({ key, label, hint, Icon }) => (
                  <button key={key} type="button" onClick={() => { tipoTouched.current = true; setTipo(key) }}
                    className={cn('min-w-0 flex-1 flex flex-col items-center justify-center gap-1.5 px-1 py-2 text-[11px] sm:text-xs font-semibold rounded-md transition-all',
                      tipo === key ? 'bg-gradient-to-r from-theme-from to-theme-to text-white shadow-sm' : 'text-slate-500 hover:text-theme-text hover:bg-theme-light')}>
                    <Icon className={cn('w-4 h-4', tipo === key ? 'text-white' : 'text-slate-400')} />
                    <span className="max-w-full whitespace-normal leading-tight text-center">{label}</span>
                    <span className={cn('text-[10px] font-medium', tipo === key ? 'text-white/80' : 'text-slate-400')}>{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Resumen ───────────────────────────────────────────────────── */}
          <div className="animate__animated animate__fadeIn animate__faster grid grid-cols-1 md:grid-cols-3 gap-0 rounded-xl overflow-hidden shadow-sm bg-gradient-to-r from-theme-from to-theme-to">
            <div className="p-6 flex items-center gap-5 relative">
              <div className={stripIcon}><Wallet className="w-6 h-6 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/90 mb-1">Monto *</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-2xl font-bold text-white truncate">{formatAmount(amountNumber, '')}</span>
                    <span className="text-sm font-medium text-white/90">{moneda}</span>
                  </div>
                  <AmountPopover value={amount} moneda={moneda} onApply={setAmount}
                    triggerClassName="bg-transparent border-white/30 text-white/80 hover:text-white hover:bg-white/20 hover:border-white/50" />
                </div>
              </div>
              {divider}
            </div>

            <div className="p-6 flex items-center gap-5 relative">
              <div className={stripIcon}>{facturable ? <Receipt className="w-6 h-6 text-white" /> : <Ban className="w-6 h-6 text-white" />}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/90 mb-1">Cobro al cliente</p>
                <div className="flex bg-white/10 rounded-md p-0.5 w-fit">
                  {[{ v: true, l: 'Facturable' }, { v: false, l: 'No facturable' }].map(o => (
                    <button key={o.l} type="button" onClick={() => setFacturable(o.v)}
                      className={cn('px-3 py-1 text-xs font-bold rounded transition-colors', facturable === o.v ? 'bg-white text-theme-text shadow-sm' : 'text-white hover:bg-white/20 font-medium')}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {!facturable && <p className="mt-1 text-[11px] text-white/80">Lo absorbe el despacho; no entra a Prebill.</p>}
              </div>
              {divider}
            </div>

            <div className="p-6 flex items-center gap-5">
              <div className={stripIcon}><Percent className="w-6 h-6 text-white" /></div>
              <div>
                <p className="text-xs font-semibold text-white/90 mb-1">Impuesto</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{tipo === 'gasto' ? 'Con IVA' : 'Sin IVA'}</span>
                </div>
                <p className="text-[11px] text-white/80">{tipo === 'gasto' ? 'Genera CFDI' : 'Pago a cuenta del cliente, sin CFDI'}</p>
              </div>
            </div>
          </div>

          {/* ── Descripción y notas ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <DescriptionCard className="lg:col-span-2" title="Descripción del gasto" value={description} onChange={setDescription}
              placeholder="Describe el gasto: concepto, proveedor, número de comprobante..." />

            <div className={cn(cardCls, 'min-w-0 flex flex-col self-start')}>
              <div className="flex items-center gap-2 mb-3">
                <Info className={sectionIconCls} />
                <span className={cn(sectionTitleCls, 'text-theme-text')}>Antes de guardar</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex gap-2"><span className="text-theme-text font-bold">•</span>El gasto se guarda en la moneda del proyecto ({moneda}).</li>
                <li className="flex gap-2"><span className="text-theme-text font-bold">•</span><span><b>Gasto</b>: lleva IVA y genera CFDI. <b>Reembolso</b>: pago a cuenta del cliente, sin IVA.</span></li>
                <li className="flex gap-2"><span className="text-theme-text font-bold">•</span><span>Queda como <b>capturado</b> y entra a una Prebill después de liberarse.</span></li>
              </ul>
              {editDetail && (
                <div className="mt-4 border border-theme-border bg-theme-light/20 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold text-theme-text">Estado:</span> {editDetail.status}</p>
                  {editDetail.reembolso_estado && <p><span className="font-semibold text-theme-text">Reembolso al abogado:</span> {editDetail.reembolso_estado}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.type === 'error' && !organizationId ? undefined : () => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        type={statusModal.type} title={statusModal.title} message={statusModal.message}
      />
    </div>
  )
}

export default App
