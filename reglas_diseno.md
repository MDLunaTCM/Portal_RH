# Reglas de Diseño y Arquitectura — Red App
 
Este documento define los estándares de diseño, arquitectura de componentes y patrones de desarrollo frontend que se aplican en todos los proyectos de la familia Red App. Su objetivo es garantizar consistencia visual y arquitectónica tanto en proyectos nuevos como en migraciones.
 
---
 
## Stack Tecnológico
 
| Capa | Tecnología |
|------|-----------|
| Framework UI | React 19+ con TypeScript 5.7+ |
| Build Tool | Vite 6+ |
| Router | React Router 7+ (con data loaders) |
| Estilos | Tailwind CSS 4+ |
| Componentes base | shadcn/ui (estilo `new-york`) |
| Primitivos UI | Radix UI |
| Íconos | Lucide React |
| Estado global | Zustand 5+ |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack React Table 8+ |
| Gráficas | Recharts |
| HTTP | Axios (o adaptador Supabase, ver sección Backend) |
| Notificaciones | React Toastify |
| Utilidades CSS | clsx + tailwind-merge vía `cn()` |
| Fechas | date-fns (locale `es`) |
 
---
 
## Paleta de Colores y Tema
 
### Sistema de colores
 
Se usa el espacio de color **OKLch** con variables CSS. El tema se aplica con la clase `.dark` en el elemento `html`. La paleta **naranja/terracota** es el color de identidad de marca.
 
### Variables CSS — Modo Claro (`:root`)
 
```css
:root {
  --radius: 0.3rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.62 0.2212 25.56);           /* Naranja marca */
  --primary-foreground: oklch(0.971 0.013 17.38);
  --secondary: oklch(0.34 0.140481 29.2339);      /* Café oscuro */
  --secondary-foreground: oklch(0.16 0.066 29.23);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.637 0.237 25.331);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.637 0.237 25.331);
}
```
 
### Variables CSS — Modo Oscuro (`.dark`)
 
```css
.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.62 0.2212 25.56);           /* Misma marca en oscuro */
  --primary-foreground: oklch(0.971 0.013 17.38);
  --secondary: oklch(0.34 0.140481 29.2339);
  --secondary-foreground: oklch(0.16 0.066 29.23);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.637 0.237 25.331);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.637 0.237 25.331);
}
```
 
### Configuración de Tailwind (`index.css`)
 
```css
@import "tailwindcss";
@import "tw-animate-css";
 
@custom-variant dark (&:is(.dark *));
 
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... mapeo 1:1 de cada variable al sistema de Tailwind ... */
}
```
 
### Reglas de uso de colores
 
- `bg-primary` / `text-primary` → color de marca, botones principales, header de app
- `bg-secondary` / `text-secondary` → acciones secundarias, hover en sidebar
- `bg-card` → contenedores, formularios, paneles
- `bg-muted` → fondos suaves, estados deshabilitados
- `text-muted-foreground` → texto de ayuda, placeholders
- `bg-destructive` → acciones destructivas (eliminar, cancelar)
- **Nunca usar colores hardcoded** (e.g., `bg-orange-500`). Siempre usar las variables del sistema
 
---
 
## Modo Oscuro
 
### Implementación
 
El modo oscuro se maneja mediante un `ThemeContext` que persiste la preferencia en `localStorage`.
 
```tsx
// src/contexts/ThemeContext.tsx
type Theme = "dark" | "light" | "system"
 
export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
 
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
 
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark" : "light"
            root.classList.add(systemTheme)
            return
        }
        root.classList.add(theme)
    }, [theme])
    // ...
}
```
 
### Reglas del modo oscuro
 
- El `ThemeProvider` siempre envuelve el `AppLayout` completo
- `defaultTheme="system"` → respeta preferencia del OS por defecto
- `storageKey="ui-theme"` → clave estándar en localStorage
- Para acceder: `const { theme, setTheme } = useTheme()`
- Exponer un toggle en `NavUser` (menú de usuario en sidebar)
 
---
 
## Configuración de shadcn/ui (`components.json`)
 
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```
 
- Estilo: **new-york** (bordes más marcados, inputs con borde visible)
- CSS Variables habilitadas (sin valores Tailwind hardcoded)
- Path alias `@/` → `src/`
 
---
 
## Estructura de Directorios
 
```
src/
├── components/
│   ├── ui/              # Componentes base de shadcn (Button, Card, Input, etc.)
│   ├── common/          # Componentes genéricos reutilizables (PageHeader, KpiCard, FullPageLoader)
│   ├── form/            # Inputs de formulario encapsulados (FormCombobox, FormSelect, etc.)
│   ├── sidebar/         # Navegación lateral (AppSidebar, NavPages, NavUser, AppSwitcher)
│   └── [modulo]/        # Componentes por dominio funcional (pedidos/, embarques/, etc.)
├── pages/               # Componentes de ruta (uno por página)
├── layouts/             # Layouts base (AppLayout)
├── stores/              # Stores de Zustand (uno por dominio)
├── models/              # Interfaces TypeScript + servicio API por entidad
├── services/            # Clientes HTTP (api.ts o adaptador supabase)
├── loaders/             # Data loaders de React Router
├── hooks/               # Custom hooks
├── contexts/            # ThemeContext, PageTitleContext
├── schemas/             # Esquemas de validación Zod
├── utils/               # Funciones utilitarias (date, auth, file)
├── types/               # Tipos TypeScript globales
└── constants/           # Constantes de aplicación
```
 
### Reglas de organización
 
- Los componentes de dominio van en `components/[modulo]/` (ej: `components/pedidos/TablaPedidos.tsx`)
- Los componentes de UI base **no se modifican** — se extienden o envuelven
- Un archivo por componente, nombrado en **PascalCase**
- Los stores, models y loaders van en su directorio, no dentro de `pages/`
 
---
 
## Layout del Sistema
 
### AppLayout
 
Es el layout raíz que envuelve toda la aplicación autenticada:
 
```tsx
const AppLayout = () => {
    const navigation = useNavigation()
    const isLoading = navigation.state === "loading"
 
    return (
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <ToastContainer />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="p-4 pt-0">
                    {isLoading && <FullPageLoader />}
                    <Suspense fallback={<Loader2 className="animate-spin" />}>
                        {/* Header fijo */}
                        <div className="border-b -mx-4 sticky top-0 z-[5] p-4 bg-primary border-gray-400/50 flex items-center gap-5 mb-4">
                            <SidebarTrigger size="lg" className="-ml-1 text-white hover:bg-secondary hover:text-white" />
                            <img src={Logo} alt="Logo" className="h-8 w-auto" />
                        </div>
                        <Outlet />
                    </Suspense>
                </SidebarInset>
            </SidebarProvider>
        </ThemeProvider>
    )
}
```
 
### Reglas del Layout
 
- **Header sticky** con `bg-primary` (naranja de marca), logo blanco, y trigger del sidebar
- **`SidebarInset`** con `p-4 pt-0` como padding del contenido
- **`FullPageLoader`** se muestra durante navegación entre rutas (React Router `navigation.state`)
- El layout de login/auth va **fuera** del `AppLayout` (ruta separada sin sidebar)
- El `ToastContainer` vive en el layout, no en páginas individuales
 
---
 
## Sidebar y Navegación
 
```
AppSidebar
├── AppSwitcher         → Selector de módulo/app (Almacen, Obra, Central...)
├── NavPages            → Ítems de navegación filtrados por permisos del usuario
│   └── SideBarItem     → Ítem recursivo (soporta submenús)
└── NavUser             → Perfil de usuario + logout + toggle de tema
```
 
### Reglas del Sidebar
 
- La navegación se filtra con `accesos.paginas` del store de auth
- Usar `NavUser` para exponer toggle de tema oscuro/claro
- `AppSwitcher` para cambiar entre aplicaciones del ecosistema
- Los ítems activos usan `bg-sidebar-accent` / `text-sidebar-accent-foreground`
 
---
 
## Componentes Base Reutilizables
 
### PageHeader
 
```tsx
<PageHeader title="Pedidos Activos" description="Lista de pedidos en proceso" />
```
 
Úsalo al inicio de toda página para mantener consistencia de encabezados.
 
### KpiCard
 
```tsx
<KpiCard
    title="Total Pedidos"
    value={142}
    icon={<Package />}
    description="En proceso"
/>
```
 
Card de métrica para dashboards. Incluye ícono, título, valor y descripción opcional.
 
### FullPageLoader
 
Se muestra automáticamente durante la navegación. No llamarlo manualmente en páginas.
 
---
 
## Clases CSS de Componentes (Layer Components)
 
Definidas en `index.css` bajo `@layer components`:
 
```css
/* Contenedor de formulario */
.form {
    @apply bg-card border p-4 rounded space-y-4;
}
 
/* Grid de inputs responsivo */
.form-input-container {
    @apply grid grid-cols-1 gap-4
           sm:grid-cols-2
           md:grid-cols-3
           lg:grid-cols-4
           xl:grid-cols-5
           2xl:grid-cols-6
           transition-all duration-300;
}
 
/* Indicadores de estado (puntos de color) */
.indicator      { @apply w-2 h-2 rounded-full inline-block mr-1 bg-blue-500; }
.kit-indicator  { @apply w-2 h-2 rounded-full inline-block mr-1 bg-blue-500; }
.vale-indicator { @apply w-2 h-2 rounded-full inline-block mr-1 bg-green-500; }
```
 
### Patrón de página con formulario de filtros
 
```tsx
<div className="space-y-4">
    {/* Panel de filtros */}
    <div className="form">
        <div className="form-input-container">
            <FormTextInput label="Buscar" ... />
            <FormSelect label="Estado" ... />
            <FormDateInput label="Fecha" ... />
        </div>
    </div>
 
    {/* Tabla de datos */}
    <DataTable columns={columns} data={data} />
</div>
```
 
---
 
## Componentes de Formulario (`src/components/form/`)
 
Todos los inputs de formulario se encapsulan. **Nunca usar `<input>` o `<select>` nativos directamente** en páginas o formularios.
 
| Componente | Uso |
|-----------|-----|
| `FormTextInput` | Texto libre |
| `FormNumberInput` | Numérico (sin flechas de browser) |
| `FormSelect` | Select simple |
| `FormCombobox` | Select con búsqueda (Popover + Command) |
| `FormDateInput` | Selector de fecha con calendario |
| `FormFileInput` | Carga de archivos con preview |
 
### Props estándar de inputs
 
```tsx
interface FormInputProps {
    label: string
    placeholder?: string
    value: string | number
    onChange: (value: string) => void
    disabled?: boolean
    error?: string
}
```
 
### Validación con Zod + React Hook Form
 
```tsx
// src/schemas/pedido.schema.ts
const pedidoSchema = z.object({
    folio: z.string().min(1, "El folio es requerido"),
    municipio_id: z.string(),
    fecha_requerida: z.string(),
})
 
// En el componente:
const form = useForm({ resolver: zodResolver(pedidoSchema) })
```
 
---
 
## Tablas de Datos (`DataTable`)
 
Se usa **TanStack React Table v8** envuelto en el componente `DataTable`.
 
```tsx
const columns: ColumnDef<Pedido>[] = [
    {
        accessorKey: "folio",
        header: "Folio",
    },
    {
        accessorKey: "estatus",
        header: "Estatus",
        cell: ({ row }) => <Badge>{row.original.estatus}</Badge>,
    },
    {
        id: "actions",
        cell: ({ row }) => <AccionesPedido pedido={row.original} />,
    },
]
 
<DataTable columns={columns} data={pedidos} />
```
 
### Capacidades estándar de DataTable
 
- Selección de filas con checkbox
- Ordenamiento por columna
- Paginación configurable
- Estado de carga (`loading`)
- Renderizado personalizado por celda
 
---
 
## Estado Global (Zustand)
 
### Patrón estándar de store
 
```ts
// src/stores/[entidad].store.ts
import { create } from 'zustand'
import { Entidad, EntidadFilter, EntidadService } from '@/models/entidad.model'
 
interface EntidadState {
    items: Entidad[]
    loading: boolean
    error: any
    fetchItems: (filter?: EntidadFilter) => Promise<void>
}
 
const useEntidadStore = create<EntidadState>((set) => ({
    items: [],
    loading: false,
    error: null,
 
    fetchItems: async (filter) => {
        set({ loading: true, error: null, items: [] })
        try {
            const data = await EntidadService.getFiltered(filter || {})
            set({ items: data, loading: false })
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            set({ error: err, loading: false })
        }
    }
}))
 
export default useEntidadStore
```
 
### Auth store (con persistencia)
 
```ts
// src/stores/auth.store.ts — usa persist middleware
const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({ ... }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
```
 
### Reglas de stores
 
- Un store por dominio funcional
- El store de auth **siempre** usa `persist` en localStorage
- Los demás stores **no persisten** (datos frescos en cada sesión)
- Usar `AbortController` en llamadas con filtros para evitar race conditions
- Estado inicial: `{ items: [], loading: false, error: null }`
 
---
 
## Modelos y Servicios de API
 
### Patrón estándar de modelo
 
Cada entidad tiene su archivo en `src/models/` con:
1. Interfaces TypeScript
2. Objeto de servicio con métodos de API
 
```ts
// src/models/entidad.model.ts
import api from "@/services/api"  // o supabaseService (ver sección Backend)
 
export interface Entidad {
    id: number
    nombre: string
    // ...
}
 
export interface EntidadFilter {
    query?: string
    fecha_inicio?: string
    // ...
}
 
let abortController: AbortController | null = null
const endPoint = "v2/entidades"
 
export const EntidadService = {
    getAll: async (): Promise<Entidad[]> => {
        if (abortController) abortController.abort()
        abortController = new AbortController()
        try {
            const response = await api.get(endPoint, { signal: abortController.signal })
            return response.data
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return []
            throw error
        }
    },
 
    getFiltered: async (filters: EntidadFilter): Promise<Entidad[]> => {
        if (abortController) abortController.abort()
        abortController = new AbortController()
        const params = new URLSearchParams()
        if (filters.query) params.append("query", filters.query)
        try {
            const response = await api.get(endPoint, { params, signal: abortController.signal })
            return response.data
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return []
            throw error
        }
    },
 
    create: async (data: Partial<Entidad>): Promise<Entidad> => {
        const response = await api.post(endPoint, data)
        return response.data
    },
 
    update: async (id: number, data: Partial<Entidad>): Promise<Entidad> => {
        const response = await api.put(`${endPoint}/${id}`, data)
        return response.data
    },
 
    delete: async (id: number): Promise<void> => {
        await api.delete(`${endPoint}/${id}`)
    }
}
```
 
---
 
## Adaptador de Backend (Laravel vs Supabase)
 
El servicio de API es el único punto donde cambia el backend. El resto de la arquitectura (stores, models, componentes, páginas) **permanece idéntico**.
 
### Opción A: Laravel (REST API + Sanctum)
 
```ts
// src/services/api.ts
import axios from 'axios'
 
const protocol = window.location.protocol
const url = import.meta.env.VITE_API_URL || "localhost:8000/api/"
 
const api = axios.create({
    baseURL: `${protocol}//${url}`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})
 
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 && import.meta.env.PROD) {
            localStorage.clear()
            window.location.href = '/auth/login'
        }
        return Promise.reject(error)
    }
)
 
export default api
```
 
Variables de entorno para Laravel:
```env
VITE_API_URL=api.miapp.com/api/
VITE_API_CENTRAL_URL=central.miapp.com/api/
```
 
### Opción B: Supabase
 
```ts
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
 
export const supabase = createClient(supabaseUrl, supabaseKey)
```
 
Variables de entorno para Supabase:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
 
### Adaptador de servicio con Supabase
 
Al usar Supabase, los métodos de `EntidadService` cambian internamente pero **mantienen la misma firma pública**:
 
```ts
// src/models/entidad.model.ts — versión Supabase
import { supabase } from "@/services/supabase"
 
export const EntidadService = {
    getAll: async (): Promise<Entidad[]> => {
        const { data, error } = await supabase
            .from('entidades')
            .select('*')
        if (error) throw error
        return data
    },
 
    getFiltered: async (filters: EntidadFilter): Promise<Entidad[]> => {
        let query = supabase.from('entidades').select('*')
        if (filters.query) query = query.ilike('nombre', `%${filters.query}%`)
        const { data, error } = await query
        if (error) throw error
        return data
    },
 
    create: async (data: Partial<Entidad>): Promise<Entidad> => {
        const { data: result, error } = await supabase
            .from('entidades')
            .insert(data)
            .select()
            .single()
        if (error) throw error
        return result
    },
 
    update: async (id: number, data: Partial<Entidad>): Promise<Entidad> => {
        const { data: result, error } = await supabase
            .from('entidades')
            .update(data)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return result
    },
 
    delete: async (id: number): Promise<void> => {
        const { error } = await supabase
            .from('entidades')
            .delete()
            .eq('id', id)
        if (error) throw error
    }
}
```
 
### Auth con Supabase
 
```ts
// src/models/auth.model.ts — versión Supabase
import { supabase } from "@/services/supabase"
 
export const authService = {
    login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data.user
    },
    logout: async () => {
        await supabase.auth.signOut()
    },
    getSession: async () => {
        const { data } = await supabase.auth.getSession()
        return data.session
    }
}
```
 
### Regla de selección de backend
 
- El tipo de backend se controla **solo** mediante variables de entorno en `.env`
- Las interfaces (`Entidad`, `EntidadFilter`) no cambian entre backends
- Los stores y componentes no saben qué backend se usa
- Para proyectos nuevos con Supabase, reemplazar `src/services/api.ts` por `src/services/supabase.ts`
 
---
 
## Data Loaders (React Router)
 
Los loaders cargan datos antes de renderizar la página. Esto evita loading states en el componente.
 
```ts
// src/loaders/entidades.loader.ts
import { EntidadService } from "@/models/entidad.model"
 
export async function entidadesLoader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const query = url.searchParams.get("query") || ""
    const data = await EntidadService.getFiltered({ query })
    return { entidades: data }
}
```
 
```tsx
// En el componente de página:
const { entidades } = useLoaderData<typeof entidadesLoader>()
```
 
```tsx
// En el router:
{
    path: "/entidades",
    element: <EntidadesPage />,
    loader: entidadesLoader,
}
```
 
### Reglas de loaders
 
- Un archivo de loader por módulo (`pedidos.loader.ts`, `viajes.loader.ts`)
- Los filtros de URL se leen con `new URL(request.url).searchParams`
- Si el loader falla con 401, el interceptor de Axios redirige al login
- Los loaders coexisten con los stores: el loader carga el estado inicial, el store maneja cambios posteriores
 
---
 
## Notificaciones Toast
 
```tsx
import { toast } from 'react-toastify'
 
// Operación async con estados automáticos
toast.promise(
    EntidadService.create(data),
    {
        pending: 'Guardando...',
        success: 'Guardado correctamente',
        error: 'Error al guardar'
    }
)
 
// Notificación directa
toast.success('Operación exitosa')
toast.error('Algo salió mal')
```
 
- El `<ToastContainer />` solo va en `AppLayout`, nunca en páginas individuales
- Usar `toast.promise()` para operaciones async — maneja pending/success/error automáticamente
 
---
 
## Utilidades Estándar
 
### `cn()` — Merge de clases Tailwind
 
```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```
 
Uso: `className={cn("base-class", condition && "conditional-class", props.className)}`
 
### Fechas
 
```ts
// src/utils/date.utils.ts
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
 
export const simpleDateFormat = (date: string) =>
    format(parseISO(date), "dd MMM yyyy", { locale: es })
 
export const simpleDateTimeFormat = (date: string) =>
    format(parseISO(date), "dd MMM yyyy hh:mm a", { locale: es })
```
 
### Archivos
 
```ts
// src/utils/lib/utils.ts
export const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
    })
 
export const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
 
export const formatSelectOptions = (options: { id: number, nombre: string }[]) =>
    options.map(o => ({ label: o.nombre, value: String(o.id) }))
```
 
---
 
## Patrones Visuales Recurrentes
 
### Dashboard con KPIs
 
```tsx
<div className="space-y-4">
    <PageHeader title="Dashboard" />
 
    {/* KPI Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total" value={142} icon={<Package />} />
        <KpiCard title="Activos" value={38} icon={<Clock />} />
    </div>
 
    {/* Tabs de contenido */}
    <Tabs defaultValue="tabla">
        <TabsList>
            <TabsTrigger value="tabla">Tabla</TabsTrigger>
            <TabsTrigger value="grafica">Gráfica</TabsTrigger>
        </TabsList>
        <TabsContent value="tabla">
            <DataTable columns={columns} data={data} />
        </TabsContent>
        <TabsContent value="grafica">
            <BarChart data={chartData} />
        </TabsContent>
    </Tabs>
</div>
```
 
### Página de listado con filtros
 
```tsx
<div className="space-y-4">
    <PageHeader title="Pedidos" />
 
    {/* Filtros */}
    <div className="form">
        <div className="form-input-container">
            <FormTextInput label="Buscar" value={query} onChange={setQuery} />
            <FormSelect label="Estado" items={estados} value={estado} onChange={setEstado} />
            <FormDateInput label="Desde" value={desde} onChange={setDesde} />
        </div>
    </div>
 
    {/* Tabla */}
    <DataTable columns={columns} data={pedidos} />
</div>
```
 
### Detalle con tabs
 
```tsx
<div className="space-y-4">
    <PageHeader title={`Pedido #${pedido.folio}`} />
 
    <Tabs defaultValue="general">
        <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="elementos">Elementos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <div className="form">...</div>
        </TabsContent>
    </Tabs>
</div>
```
 
### Dialog de confirmación
 
```tsx
<AlertDialog>
    <AlertDialogTrigger asChild>
        <Button variant="destructive">Eliminar</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```
 
---
 
## Checklist para Proyecto Nuevo
 
Al iniciar un proyecto con este patrón:
 
- [ ] Copiar `src/index.css` completo (variables de color, layer base, layer components)
- [ ] Copiar `components.json` (estilo new-york, cssVariables, alias)
- [ ] Instalar dependencias: `shadcn`, `zustand`, `react-hook-form`, `zod`, `tanstack/react-table`, `recharts`, `lucide-react`, `react-toastify`, `date-fns`, `axios` (o `@supabase/supabase-js`)
- [ ] Crear `src/contexts/ThemeContext.tsx`
- [ ] Crear `src/services/api.ts` (Axios) o `src/services/supabase.ts` según backend
- [ ] Crear `src/lib/utils.ts` con `cn()`
- [ ] Copiar componentes de `src/components/ui/` base (Button, Card, Input, Dialog, Table, Tabs, Sidebar)
- [ ] Copiar componentes de `src/components/common/` (PageHeader, KpiCard, FullPageLoader)
- [ ] Copiar componentes de `src/components/form/`
- [ ] Crear `src/layouts/AppLayout.tsx` con el patrón de layout documentado
- [ ] Crear `src/stores/auth.store.ts` con persistencia en localStorage
- [ ] Configurar React Router con `AppLayout` como layout raíz y ruta `/auth/login` separada
 
---
 
## Reglas Generales de Código
 
1. **TypeScript estricto** — sin `any` explícito en interfaces de entidades
2. **Alias `@/`** siempre en imports, nunca rutas relativas largas (`../../..`)
3. **PascalCase** para componentes, **camelCase** para funciones y variables
4. **Un componente por archivo**, nombrado igual que el archivo
5. **No modificar archivos en `src/components/ui/`** directamente — extender o envolver
6. **AbortController** en toda llamada de servicio que pueda repetirse rápido (filtros, búsqueda)
7. **Zod** para toda validación de formulario — nunca validación manual ad-hoc
8. **`cn()`** para todas las clases condicionales de Tailwind
9. **Lucide React** para íconos — nunca SVGs inline ni otras librerías
10. **date-fns con locale `es`** para todas las fechas mostradas al usuario