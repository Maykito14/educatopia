// ── Enums ────────────────────────────────────────────────────
export type Rol             = "alumno" | "padre" | "profesor" | "admin";
export type NivelEducativo  = "primario" | "secundario" | "terciario" | "taller";
export type DuracionMinutos = 60 | 90 | 120;
export type SlotEstado      = "disponible" | "lleno" | "cancelado";
export type TurnoEstado     = "pendiente" | "confirmado" | "cancelado" | "completado";
export type NivelMateria    = "primario" | "secundario" | "terciario" | "taller" | "todos";

// ── Tablas ───────────────────────────────────────────────────

export interface Profile {
  id: string;
  nombre: string;
  telefono: string | null;
  rol: Rol;
  created_at: string;
}

export interface Alumno {
  id: string;
  profile_id: string | null;
  tutor_id: string | null;
  nombre: string;
  apellido: string;
  edad: number | null;
  nivel_educativo: NivelEducativo | null;
  anio_grado: string | null;
  colegio: string | null;
  colegio_id: string | null;
  telefono_contacto: string | null;
  nombre_contacto: string | null;
  origen: string | null;
  created_at: string;
}

export interface Colegio {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface Materia {
  id: string;
  nombre: string;
  nivel: NivelMateria;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface Profesor {
  id: string;
  profile_id: string | null;
  nombre: string;
  materias: string[];
  activo: boolean;
  created_at: string;
}

export interface ProfesorMateria {
  id: string;
  profesor_id: string;
  materia_id: string;
}

export interface ProfesorDisponibilidad {
  id: string;
  profesor_id: string;
  dia_semana: number;   // 0=domingo … 6=sábado
  hora_inicio: string;  // "09:00:00"
  hora_fin: string;     // "13:00:00"
  duracion_minutos: DuracionMinutos;
  activo: boolean;
  created_at: string;
}

export interface Slot {
  id: string;
  profesor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: DuracionMinutos;
  capacidad_max: number;
  estado: SlotEstado;
  created_at: string;
}

export interface Turno {
  id: string;
  slot_id: string;
  alumno_id: string;
  materia: string;
  anio: string;
  colegio: string;
  objetivo: string | null;
  estado: TurnoEstado;
  solicitado_por: string | null;
  notas: string | null;
  confirmado_por_profesor: boolean;
  asistio: boolean | null;
  pagado: boolean;
  cobrado: boolean;
  medio_cobro: "efectivo" | "transferencia" | null;
  created_at: string;
}

export interface ProfesorBloqueo {
  id: string;
  profesor_id: string;
  fecha: string;
  motivo: string | null;
  created_at: string;
}

// ── RPC functions ─────────────────────────────────────────────

export interface OcupacionSlotRow {
  profesor_id:      string;
  fecha:            string;
  hora_inicio:      string;
  duracion_minutos: number;
  ocupados:         number;
  grupos:           { materia: string; anio: string; colegio: string }[];
}

// ── Joins frecuentes ─────────────────────────────────────────
export interface TurnoConSlot extends Turno {
  slot: Slot & { profesor: Pick<Profesor, "id" | "nombre"> };
  alumno: Pick<Alumno, "id" | "nombre" | "apellido" | "colegio">;
}

export interface SlotConTurnos extends Slot {
  profesor: Pick<Profesor, "id" | "nombre">;
  turnos: Pick<Turno, "id" | "estado" | "materia" | "anio" | "colegio">[];
}

export interface ProfesorConDisponibilidad extends Profesor {
  disponibilidad: ProfesorDisponibilidad[];
  materias_rel: (ProfesorMateria & { materia: Materia })[];
}

// ── Tipo Database (compatible con el cliente Supabase v2) ────
type R = [] // Relationships vacíos

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row:           Profile;
        Insert:        Omit<Profile, "created_at">;
        Update:        Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: R;
      };
      alumnos: {
        Row:           Alumno;
        Insert:        Omit<Alumno, "id" | "created_at">;
        Update:        Partial<Omit<Alumno, "id" | "created_at">>;
        Relationships: R;
      };
      colegios: {
        Row:           Colegio;
        Insert:        Omit<Colegio, "id" | "created_at">;
        Update:        Partial<Omit<Colegio, "id" | "created_at">>;
        Relationships: R;
      };
      materias: {
        Row:           Materia;
        Insert:        Omit<Materia, "id" | "created_at">;
        Update:        Partial<Omit<Materia, "id" | "created_at">>;
        Relationships: R;
      };
      profesores: {
        Row:           Profesor;
        Insert:        Omit<Profesor, "id" | "created_at">;
        Update:        Partial<Omit<Profesor, "id" | "created_at">>;
        Relationships: R;
      };
      profesores_materias: {
        Row:           ProfesorMateria;
        Insert:        Omit<ProfesorMateria, "id">;
        Update:        Partial<Omit<ProfesorMateria, "id">>;
        Relationships: R;
      };
      profesores_disponibilidad: {
        Row:           ProfesorDisponibilidad;
        Insert:        Omit<ProfesorDisponibilidad, "id" | "created_at">;
        Update:        Partial<Omit<ProfesorDisponibilidad, "id" | "created_at">>;
        Relationships: R;
      };
      slots: {
        Row:           Slot;
        Insert:        Omit<Slot, "id" | "created_at">;
        Update:        Partial<Omit<Slot, "id" | "created_at">>;
        Relationships: R;
      };
      turnos: {
        Row:           Turno;
        Insert:        Omit<Turno, "id" | "created_at">;
        Update:        Partial<Omit<Turno, "id" | "created_at">>;
        Relationships: R;
      };
      profesores_bloqueos: {
        Row:           ProfesorBloqueo;
        Insert:        Omit<ProfesorBloqueo, "id" | "created_at">;
        Update:        Partial<Omit<ProfesorBloqueo, "id" | "created_at">>;
        Relationships: R;
      };
    };
    Views:  Record<string, never>;
    Enums:  Record<string, never>;
    Functions: {
      get_ocupacion_slots: {
        Args: {
          p_profesor_ids: string[];
          p_desde:        string;
          p_hasta:        string;
        };
        Returns: OcupacionSlotRow[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
  };
};
