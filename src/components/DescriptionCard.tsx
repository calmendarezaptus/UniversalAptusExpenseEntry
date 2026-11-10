import { useState } from 'react'
import Typo from 'typo-js'
import { FileText, Sparkles, SpellCheck2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { cardCls, sectionIconCls, sectionTitleCls } from '@/lib/ui'

type Misspelled = { word: string; start: number; end: number; suggestions: string[] }

async function loadDictionary(lang: 'es' | 'en') {
  const [aff, dic] = await Promise.all([
    fetch(lang === 'es' ? './dict/es_aff.txt' : './dict/en_aff.txt').then(r => r.text()),
    fetch(lang === 'es' ? './dict/es_dic.txt' : './dict/en_dic.txt').then(r => r.text()),
  ])
  return new Typo(lang === 'es' ? 'es_ES' : 'en_US', aff, dic)
}

// Tarjeta de descripción con revisión ortográfica, igual a "Descripción de la actividad" de tiempos.
export function DescriptionCard({ title, value, onChange, placeholder, maxLength, className }: {
  title: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength?: number; className?: string
}) {
  const [enabled, setEnabled] = useState(true)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [checking, setChecking] = useState(false)
  const [index, setIndex] = useState(0)
  const [words, setWords] = useState<Misspelled[]>([])
  const [open, setOpen] = useState(false)

  async function start() {
    setChecking(true)
    try {
      const dict = await loadDictionary(lang)
      const regex = /[\wáéíóúüñÁÉÍÓÚÜÑ]+/g
      const errors: Misspelled[] = []
      let match
      while ((match = regex.exec(value)) !== null) {
        const word = match[0]
        if (!isNaN(Number(word))) continue
        if (!dict.check(word)) errors.push({ word, start: match.index, end: match.index + word.length, suggestions: dict.suggest(word) })
      }
      if (errors.length) { setWords(errors); setIndex(0); setOpen(true) }
      else toast.success('No se encontraron errores ortográficos.')
    } catch (error) {
      toast.error(`Error al cargar el diccionario ortográfico: ${error instanceof Error ? error.message : String(error)}`)
    }
    setChecking(false)
  }

  function next() {
    if (index + 1 < words.length) setIndex(index + 1)
    else { setOpen(false); toast.success('Revisión ortográfica completada.') }
  }

  function replace(suggestion: string) {
    const current = words[index]
    onChange(value.substring(0, current.start) + suggestion + value.substring(current.end))
    const diff = suggestion.length - current.word.length
    setWords(words.map((w, i) => i <= index ? w : { ...w, start: w.start + diff, end: w.end + diff }))
    next()
  }

  const current = words[index]

  return (
    <div className={cn(cardCls, 'min-w-0 flex flex-col', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText className={sectionIconCls} />
          <span className={cn(sectionTitleCls, 'text-theme-text')}>{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs rounded-lg border border-slate-200 bg-slate-50/80 p-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md p-1 px-2">
            <span className={cn('font-medium cursor-pointer transition-colors', lang === 'en' ? 'text-slate-400' : 'text-theme-text')} onClick={() => setLang('es')}>ES</span>
            <Switch checked={lang === 'en'} onCheckedChange={(c: boolean) => setLang(c ? 'en' : 'es')} disabled={!enabled}
              className="data-[state=checked]:bg-[#E5D3B3] data-[state=unchecked]:bg-[#E5D3B3] scale-75 border-slate-300" />
            <span className={cn('font-medium cursor-pointer transition-colors', lang === 'es' ? 'text-slate-400' : 'text-blue-500')} onClick={() => setLang('en')}>EN</span>
          </div>
          <button type="button" onClick={() => setEnabled(!enabled)}
            className={cn('flex items-center gap-1.5 font-medium transition-all px-2 py-1 rounded-md',
              enabled ? 'text-theme-text bg-theme-light hover:bg-theme-border' : 'text-slate-400 bg-slate-50 hover:bg-slate-100')}
            title={enabled ? 'Desactivar subrayado nativo' : 'Activar subrayado nativo'}>
            <SpellCheck2 className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{enabled ? 'Subrayado activo' : 'Subrayado inactivo'}</span>
          </button>
          <button type="button" onClick={() => void start()} disabled={checking || value.trim() === ''}
            className="flex items-center gap-1.5 font-medium transition-all px-2 py-1 rounded-md text-theme-text bg-theme-light hover:bg-theme-border disabled:opacity-50 disabled:cursor-not-allowed border border-theme-border"
            title="Corregir texto paso a paso">
            <SpellCheck2 className={cn('w-3.5 h-3.5', checking && 'animate-spin')} />
            <span className="whitespace-nowrap">{checking ? 'Analizando...' : 'Corregir texto'}</span>
          </button>
          <button type="button" disabled className="flex items-center gap-1.5 font-medium transition-all px-2 py-1 rounded-md text-slate-500 bg-white border border-slate-200 cursor-not-allowed"
            title="Esta funcionalidad de inteligencia artificial aún no está habilitada">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Mejorar con IA</span>
          </button>
        </div>
      </div>
      <div className="relative flex-1">
        <Textarea value={value} onChange={e => onChange(e.target.value)} spellCheck={enabled} lang={lang} maxLength={maxLength}
          className="w-full min-h-[140px] h-full bg-white border-slate-200 hover:border-slate-300 focus:border-theme-from focus:ring-1 focus:ring-theme-from/30 transition-all resize-none text-sm p-3 rounded-lg shadow-sm"
          placeholder={placeholder} />
        <div className="absolute bottom-3 right-3"><div className="w-2 h-2 border-r-2 border-b-2 border-slate-300"></div></div>
      </div>
      <p className="text-xs text-slate-500 mt-2 font-medium">{value.length}{maxLength ? ` / ${maxLength}` : ''} caracteres</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><SpellCheck2 className="w-5 h-5 text-theme-text" />Revisión Ortográfica</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="py-4">
              <p className="text-sm text-slate-500 mb-4">Palabra {index + 1} de {words.length}</p>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6 text-slate-700 text-sm leading-relaxed max-h-32 overflow-y-auto">
                {value.substring(Math.max(0, current.start - 40), current.start)}
                <span className="font-bold text-theme-text bg-theme-border px-1 rounded">{current.word}</span>
                {value.substring(current.end, Math.min(value.length, current.end + 40))}
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Sugerencias:</Label>
                {current.suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {current.suggestions.slice(0, 5).map(s => (
                      <Button key={s} variant="outline" size="sm" onClick={() => replace(s)} className="border-theme-from/30 hover:bg-theme-light hover:text-theme-text transition-colors">{s}</Button>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500 italic">No hay sugerencias disponibles.</p>}
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500">Cancelar</Button>
            <Button onClick={next} className="bg-slate-800 hover:bg-slate-900 text-white">Ignorar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
