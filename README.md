# Registro de Gastos (Expense Entry App)

Captura y edición de gastos y reembolsos por proyecto. Mismo stack, componentes y diseño que la
captura de tiempos (`UniversalAptusTimeEntry`): React + Vite + TypeScript, Tailwind CSS v4,
shadcn/ui (`new-york`, Radix), lucide, sonner, animate.css y revisión ortográfica con `typo-js`.

Se comunica con la función de Catalyst `expense_services` (proyecto Gastos), que reenvía a la API de
ReportesSandbox (los gastos son locales de Aptus; **no se escriben en Zoho Books**).

## Parámetros de URL

| Parámetro | Uso |
|---|---|
| `organization_id` | **Requerido.** Sin él la app muestra un error y no permite capturar. |
| `gasto_id` | Opcional. Abre el gasto en modo edición (ID local de Aptus). |
| `origin` | Opcional. URL a la que regresa "Cancelar" (normalmente el calendario de gastos). |

Ejemplo: `http://localhost:5173/?organization_id=636939444`

## Llamadas al backend

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/{org}/clientes`, `/{org}/proyectos`, `/{org}/abogados`, `/{org}/categorias-gasto` | Catálogos (caché de 12 h en `localStorage`) |
| POST | `/{org}/gastos` | Crear |
| GET | `/{org}/gastos/{id}` | Cargar para editar |
| PATCH | `/{org}/gastos/{id}` | Editar (el proyecto no cambia: fija la moneda) |

Un gasto en una Prebill o facturado no se puede editar (la API responde 409 y la interfaz lo avisa
antes). Si se pierde la respuesta al guardar, el botón queda en "Verificar en el listado" para
no duplicar el gasto.

## Variables de entorno (opcionales)

| Variable | Por omisión |
|---|---|
| `VITE_API_BASE_URL` | URL de `expense_services`. **Transitorio:** mientras no exista, el respaldo es `time_entry_services`, que aún tiene las rutas de gastos |
| `VITE_CALENDAR_URL` | `https://universal-expenseentry-calendar.onslate.com/` |

En desarrollo todas las llamadas pasan por el proxy de Vite `/api`.

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # pruebas de src/lib (node:test)
npm run build    # compilación para la Slate (dist/)
```

## Proyecto

Forma parte del proyecto de Catalyst **Gastos**. Configuración, despliegue y pendientes: `02-gastos/PROYECTO.md` en el repositorio de trabajo `AptusWidgets`.
