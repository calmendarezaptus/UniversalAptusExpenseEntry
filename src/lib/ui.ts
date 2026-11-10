import { useEffect, useState } from 'react'

// Mismos temas y clave de almacenamiento que la captura de tiempos (UniversalAptusTimeEntry).
export const THEMES = [
  { id: 'default', name: 'Navy Blue', color: '#1e3a8a' },
  { id: 'theme-coral', name: 'Coral', color: '#F74848' },
  { id: 'theme-emerald', name: 'Esmeralda', color: '#047857' },
  { id: 'theme-purple', name: 'Púrpura', color: '#6b21a8' },
  { id: 'theme-amber', name: 'Ámbar', color: '#b45309' },
  { id: 'theme-orange', name: 'Naranja', color: '#f97316' },
]

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('app_theme') || 'default' } catch { return 'default' }
  })
  useEffect(() => {
    try { localStorage.setItem('app_theme', theme) } catch { /* sin almacenamiento */ }
    document.documentElement.className = theme === 'default' ? '' : theme
  }, [theme])
  return [theme, setTheme] as const
}

// Clases compartidas (idénticas a las de la captura de tiempos).
export const labelCls = 'text-theme-text font-semibold text-xs'
export const sectionIconCls = 'w-4 h-4 text-theme-text'
export const sectionTitleCls = 'text-sm font-semibold text-slate-700'
export const cardCls = 'border border-slate-200 rounded-xl p-4 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]'
export const triggerCls = 'min-w-0 flex-1 justify-between border-slate-200 bg-white hover:bg-slate-50 transition-all h-9 rounded-lg font-medium text-sm pr-3 disabled:opacity-50 disabled:cursor-not-allowed'
export const refreshBtnCls = 'shrink-0 w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
export const gradientBtnCls = 'bg-gradient-to-r from-theme-from to-theme-to hover:from-theme-to hover:to-theme-from text-white'
export const inputCls = 'bg-white border-slate-200 hover:border-slate-300 focus:border-theme-from focus:ring-1 focus:ring-theme-from/30 transition-all h-9 rounded-lg shadow-sm text-slate-700 text-sm'
