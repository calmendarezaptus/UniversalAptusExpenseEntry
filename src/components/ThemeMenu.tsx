import { Check, Settings } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { THEMES } from '@/lib/ui'

// Engrane de "Apariencia" junto al título, igual al de la captura de tiempos.
export function ThemeMenu({ theme, setTheme }: { theme: string; setTheme: (id: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 outline-none" title="Configuración de apariencia">
          <Settings className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">Apariencia</div>
        <div className="space-y-1">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={cn('w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors',
                theme === t.id ? 'bg-theme-light text-theme-text font-medium' : 'text-slate-600 hover:bg-slate-100')}>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: t.color }} />
                {t.name}
              </div>
              {theme === t.id && <Check className="w-4 h-4 text-theme-text" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
