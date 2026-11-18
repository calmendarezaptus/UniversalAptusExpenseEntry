// Botón al menú principal de Aptus (igual en todas las pantallas). Lleva la organización de la URL.
// En los encabezados oscuros de los calendarios va solo el ícono (no cabe el texto).
// VITE_MENU_URL lo reemplaza si se define.
const MENU_URL = import.meta.env.VITE_MENU_URL || 'https://universal-aptus-home.onslate.com/'

export function menuHref() {
  try {
    const u = new URL(MENU_URL)
    const org = new URLSearchParams(window.location.search).get('organization_id')
    if (org) u.searchParams.set('organization_id', org)
    return u.toString()
  } catch { return MENU_URL }
}

export function MenuButton({ dark = false }: { dark?: boolean }) {
  return (
    <a href={menuHref()} title="Menú principal: todas las pantallas" aria-label="Menú principal"
      className={dark
        ? 'inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0'
        : 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors shrink-0 shadow-sm'}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </svg>
      {!dark && 'Menú'}
    </a>
  )
}
