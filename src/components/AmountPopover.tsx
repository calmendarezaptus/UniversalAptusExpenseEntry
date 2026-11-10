import { useState } from 'react'
import { Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { parseAmount } from '@/lib/expense'

// Mismo patrón que el selector de horas de la captura de tiempos: valor temporal, Cancelar / Aplicar.
export function AmountPopover({ value, moneda, onApply, triggerClassName }: {
  value: string; moneda: string; onApply: (value: string) => void; triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')

  function apply() {
    try {
      const amount = parseAmount(draft)
      onApply(amount.toFixed(2)); setError(''); setOpen(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Monto inválido.') }
  }

  return (
    <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setDraft(value === '0.00' ? '' : value); setError('') } }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Editar monto"
          className={cn('h-7 w-7 rounded-full border-slate-200 text-slate-400 hover:text-theme-text hover:bg-theme-light hover:border-theme-border transition-all', triggerClassName)}>
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={12}
        className="w-[calc(100vw-24px)] max-w-[360px] p-4 md:p-5 rounded-2xl shadow-xl border border-slate-200 bg-white">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="text-center text-[10px] font-bold mb-3 text-slate-500 uppercase tracking-widest">Monto del gasto</div>
          <div className="flex items-baseline gap-2">
            <Input autoFocus inputMode="decimal" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') apply() }} placeholder="0.00" aria-invalid={!!error}
              className="h-12 text-2xl font-bold text-right bg-white border-slate-200 focus:border-theme-from focus:ring-1 focus:ring-theme-from/30 rounded-lg" />
            <span className="text-theme-to font-semibold text-sm">{moneda}</span>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
        <div className="mt-5 flex items-center justify-end gap-3 pr-1">
          <Button variant="outline" className="h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium px-5" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="h-9 bg-gradient-to-r from-theme-from to-theme-to hover:from-theme-to hover:to-theme-from text-white rounded-lg px-6 font-bold text-sm shadow-sm transition-all border-0" onClick={apply}>Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
