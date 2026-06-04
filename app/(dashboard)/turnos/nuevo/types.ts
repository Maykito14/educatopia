export type NivelEducativo = "primario" | "secundario" | "terciario" | "taller";
export type Objetivo = "Rendir examen" | "Mejorar notas" | "Apoyo continuo" | "Ingreso universitario";
export type Origen = "Instagram" | "Facebook" | "Recomendación" | "Pasé por ahí" | "WhatsApp" | "Otro";

export interface FormData {
  // Paso 1 — alumno
  nombre: string;
  apellido: string;
  edad: string;
  nivelEducativo: NivelEducativo | "";
  anioGrado: string;
  colegio: string;          // valor del dropdown
  // Paso 2 — estudio
  materia: string;
  objetivo: Objetivo | "";
  // Paso 3 — slot
  profesorId: string;
  slotId: string;
  // Paso 4 — contacto
  nombreContacto: string;
  whatsapp: string;
  origen: Origen | "";
  dni: string;
  alumnoExistenteId: string;   // ID si el DNI ya existe en la BD
  comentarios: string;
  metodoPago: "transferencia" | "efectivo";
}

export const FORM_INITIAL: FormData = {
  nombre: "",
  apellido: "",
  edad: "",
  nivelEducativo: "",
  anioGrado: "",
  colegio: "",
  materia: "",
  objetivo: "",
  profesorId: "",
  slotId: "",
  nombreContacto: "",
  whatsapp: "",
  origen: "",
  dni: "",
  alumnoExistenteId: "",
  comentarios: "",
  metodoPago: "transferencia",
};

// ── Tipos del mock ──────────────────────────────────────────

export interface DisponibilidadSemanal {
  dia: number;          // 0=domingo … 6=sábado
  hora_inicio: string;  // "09:00"
  hora_fin: string;     // "13:00"
  // Sin duración fija — se generan turnos de 60 y 90 min cada 30 min
}

export interface ProfesorMock {
  id: string;
  nombre: string;
  materias: string[];
  niveles: NivelEducativo[];
  disponibilidad: DisponibilidadSemanal[];
}

export interface MockSlot {
  id: string;
  profesorId: string;
  profesorNombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: 60 | 90 | 120;
  capacidad_max: number;
  turnos: { materia: string; anio: string; colegio: string }[];
}
