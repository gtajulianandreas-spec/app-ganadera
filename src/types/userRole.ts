export type UserRole = 
  | 'admin'         // Administrador / Dueño: acceso completo y configuración
  | 'zootechnician' // Zootecnista: curvas de crecimiento, ganancia diaria (GDP), transición de etapas y genética
  | 'investor'      // Inversionista: valoración del hato, patrimonio, ingresos/costos consolidados y KPIs
  | 'veterinarian'  // Veterinario: tratamientos, sanidad, dosis, retiros farmacológicos y reproducción
  | 'worker';       // Mayordomo / Trabajador: registro rápido de campo, ordeño y pesaje

export interface UserRoleInfo {
  id: UserRole;
  title: string;
  shortLabel: string;
  badgeColor: string;
  description: string;
  primaryFocus: string;
}

export const USER_ROLES: Record<UserRole, UserRoleInfo> = {
  admin: {
    id: 'admin',
    title: 'Administrador / Propietario',
    shortLabel: 'Admin',
    badgeColor: 'bg-ranch-100 text-ranch-800 border-ranch-300',
    description: 'Control total de fincas, finanzas, inventarios, configuraciones y sincronización.',
    primaryFocus: 'Gestión Integral y Configuración'
  },
  zootechnician: {
    id: 'zootechnician',
    title: 'Zootecnista / Asesor Técnico',
    shortLabel: 'Zootecnista',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Enfoque en ganancia de peso (GDP), curvas de lactancia, etapas de crecimiento y genética.',
    primaryFocus: 'Crecimiento, Nutrición y Genética'
  },
  investor: {
    id: 'investor',
    title: 'Inversionista / Socio Capitalista',
    shortLabel: 'Inversionista',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Visualización ejecutiva de patrimonio en ganado, retorno de inversión y reportes consolidados.',
    primaryFocus: 'Valoración del Hato y Rentabilidad'
  },
  veterinarian: {
    id: 'veterinarian',
    title: 'Médico Veterinario',
    shortLabel: 'Veterinario',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Control de tratamientos, dosis exactas, vacunas, retiros de leche/carne y chequeos reproductivos.',
    primaryFocus: 'Sanidad, Retiros y Reproducción'
  },
  worker: {
    id: 'worker',
    title: 'Mayordomo / Operario de Finca',
    shortLabel: 'Mayordomo',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Entrada rápida de datos en potrero, lectura de chips/aretes, registro de pesaje y ordeño diario.',
    primaryFocus: 'Operación Diaria y Campo'
  }
};
