import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronsUpDown, RefreshCw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { labelCls, refreshBtnCls, triggerCls } from '@/lib/ui'
import type { Option } from '@/lib/catalogs'

function ProfileImage({ url, alt }: { url: string; alt: string }) {
  const [hasError, setHasError] = useState(false)
  if (hasError || !url) return <User className="w-4 h-4 text-slate-400" />
  return <img src={url} alt={alt} className="w-full h-full object-cover" onError={() => setHasError(true)} />
}

// Selector con búsqueda + botón de refrescar, igual al de cliente/proyecto/abogado de la captura de tiempos.
export function SearchSelect<T extends Option>({
  label, icon, options, value, onChange, loading, disabled, disabledText, placeholder,
  searchPlaceholder, emptyText, onRefresh, withAvatar, allowClear = true,
}: {
  label: string; icon: ReactNode; options: T[]; value: string; onChange: (id: string) => void
  loading?: boolean; disabled?: boolean; disabledText?: string; placeholder: string
  searchPlaceholder: string; emptyText: string; onRefresh?: () => void; withAvatar?: boolean; allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find(o => o.ID === value)
  const filtered = useMemo(() => {
    if (!search) return options.slice(0, 100)
    const lower = search.toLowerCase()
    return options.filter(o => o.display.toLowerCase().includes(lower) || (o.secondary && o.secondary.toLowerCase().includes(lower))).slice(0, 100)
  }, [options, search])

  return (
    <div className="space-y-2 min-w-0">
      <Label className={cn(labelCls, 'flex items-center gap-1.5 ml-1')}>
        {icon}
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled || loading}
              className={cn(triggerCls, !value ? 'text-slate-500' : 'text-slate-900')}>
              <span className="truncate text-left" title={selected?.display}>
                {loading ? 'Cargando...' : disabled && disabledText ? disabledText : selected ? selected.display : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filtered.map(o => (
                    <CommandItem key={o.ID} value={o.display} className={withAvatar ? 'flex items-center gap-2 py-2' : undefined}
                      onSelect={() => { onChange(o.ID === value && allowClear ? '' : o.ID); setSearch(''); setOpen(false) }}>
                      <Check className={cn(withAvatar ? 'mr-1 h-4 w-4 shrink-0' : 'mr-2 h-4 w-4', value === o.ID ? 'opacity-100' : 'opacity-0')} />
                      {withAvatar ? (
                        <>
                          <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                            {o.fotoUrl ? <ProfileImage url={o.fotoUrl} alt={o.display} /> : <User className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="flex flex-col ml-1">
                            <span className="font-medium text-slate-800">{o.display}</span>
                            {o.secondary && <span className="text-xs text-slate-500">{o.secondary}</span>}
                          </div>
                        </>
                      ) : (
                        <span className="flex flex-col">
                          <span>{o.display}</span>
                          {o.secondary && <span className="text-xs text-slate-500">{o.secondary}</span>}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={disabled || loading} className={refreshBtnCls} title="Refrescar catálogo">
            <RefreshCw className={cn('w-4 h-4 transition-all', loading ? 'animate-spin text-theme-text' : 'text-slate-500')} />
          </button>
        )}
      </div>
    </div>
  )
}
