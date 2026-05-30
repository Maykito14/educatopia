import type { MockSlot, NivelEducativo, ProfesorMock } from "./types";

// ── Colegios (tabla administrable por el Admin) ─────────────
export const COLEGIOS_MOCK: string[] = [
  "Dr. Dalmacio Velez Sársfield",
  "Instituto Hermanas Mercedarias",
  "IPEM 329",
  "IPETAYM 68",
  "Esc. Manuel Belgrano",
  "Esc. José María Paz",
  "Esc. José Gimenez Lagos",
  "Esc. María Teresa Navarro",
  "PROA",
  "Otros",
];

// ── Materias por nivel (tabla administrable, filtrada por profesor disponible) ──
export const MATERIAS_POR_NIVEL: Record<NivelEducativo, string[]> = {
  primario:   ["Lengua", "Matemática", "Inglés", "Ciencias Naturales", "Ciencias Sociales"],
  secundario: ["Matemática", "Lengua", "Inglés", "Física", "Química", "Historia", "Geografía", "Biología", "Contabilidad", "Computación", "Portugués"],
  terciario:  ["Matemática", "Inglés", "Contabilidad", "Computación", "Portugués"],
  taller:     ["Computación", "Inglés"],
};

// Iconos por materia (UI)
export const MATERIA_ICONS: Record<string, string> = {
  "Matemática":        "📐",
  "Lengua":            "📖",
  "Inglés":            "🌍",
  "Física":            "⚡",
  "Química":           "🧪",
  "Historia":          "🏛️",
  "Geografía":         "🗺️",
  "Biología":          "🌿",
  "Contabilidad":      "💼",
  "Computación":       "💻",
  "Portugués":         "🇧🇷",
  "Ciencias Naturales":"🔬",
  "Ciencias Sociales": "🌎",
};

// ── Profesores (tabla con materias y disponibilidad semanal) ─
export const PROFESORES_MOCK: ProfesorMock[] = [
  {
    id: "prof-lucia",
    nombre: "Prof. Lucía Fernández",
    materias: ["Matemática", "Física", "Ciencias Naturales"],
    niveles: ["primario", "secundario"],
    disponibilidad: [
      { dia: 1, hora_inicio: "09:00", hora_fin: "12:00" },
      { dia: 2, hora_inicio: "09:00", hora_fin: "12:00" },
      { dia: 4, hora_inicio: "14:00", hora_fin: "18:00" },
    ],
  },
  {
    id: "prof-carlos",
    nombre: "Prof. Carlos Méndez",
    materias: ["Física", "Química", "Matemática"],
    niveles: ["secundario", "terciario"],
    disponibilidad: [
      { dia: 2, hora_inicio: "14:00", hora_fin: "18:00" },
      { dia: 3, hora_inicio: "09:00", hora_fin: "12:00" },
      { dia: 5, hora_inicio: "16:00", hora_fin: "20:00" },
    ],
  },
  {
    id: "prof-ana",
    nombre: "Prof. Ana Ríos",
    materias: ["Inglés", "Portugués"],
    niveles: ["primario", "secundario", "terciario", "taller"],
    disponibilidad: [
      { dia: 1, hora_inicio: "14:00", hora_fin: "18:00" },
      { dia: 3, hora_inicio: "14:00", hora_fin: "18:00" },
      { dia: 6, hora_inicio: "09:00", hora_fin: "13:00" },
    ],
  },
  {
    id: "prof-marta",
    nombre: "Prof. Marta Villalba",
    materias: ["Historia", "Geografía", "Lengua", "Ciencias Sociales"],
    niveles: ["primario", "secundario"],
    disponibilidad: [
      { dia: 1, hora_inicio: "10:00", hora_fin: "13:00" },
      { dia: 3, hora_inicio: "09:00", hora_fin: "12:00" },
      { dia: 5, hora_inicio: "09:00", hora_fin: "12:00" },
    ],
  },
  {
    id: "prof-diego",
    nombre: "Prof. Diego Sosa",
    materias: ["Computación", "Contabilidad"],
    niveles: ["secundario", "terciario", "taller"],
    disponibilidad: [
      { dia: 2, hora_inicio: "17:00", hora_fin: "20:00" },
      { dia: 4, hora_inicio: "17:00", hora_fin: "20:00" },
      { dia: 6, hora_inicio: "09:00", hora_fin: "12:00" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m: number) {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function formatFecha(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function diaNombre(n: number) {
  return ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][n];
}

// ── Generación dinámica de slots ─────────────────────────────
// Cada bloque de disponibilidad genera turnos de 60 y 90 min,
// con inicio cada 30 minutos dentro de la ventana.
const DURACIONES: (60 | 90)[] = [60, 90];
const INTERVALO = 30; // minutos entre inicios de turno

export function buildSlotsFromProfesores(profesores: ProfesorMock[]): MockSlot[] {
  const slots: MockSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dow = date.getDay();
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    for (const prof of profesores) {
      for (const avail of prof.disponibilidad.filter((d) => d.dia === dow)) {
        const windowStart = timeToMin(avail.hora_inicio);
        const windowEnd   = timeToMin(avail.hora_fin);

        for (let start = windowStart; start < windowEnd; start += INTERVALO) {
          for (const dur of DURACIONES) {
            const end = start + dur;
            if (end > windowEnd) continue;

            slots.push({
              id: `${prof.id}-${dateStr}-${pad(Math.floor(start / 60))}${pad(start % 60)}-${dur}`,
              profesorId: prof.id,
              profesorNombre: prof.nombre,
              fecha: dateStr,
              hora_inicio: minToTime(start),
              hora_fin: minToTime(end),
              duracion_minutos: dur,
              capacidad_max: 4,
              turnos: [],
            });
          }
        }
      }
    }
  }

  return slots;
}

function buildSlots(): MockSlot[] {
  const slots = buildSlotsFromProfesores(PROFESORES_MOCK);

  // Turnos de demo para mostrar el badge de agrupamiento
  const slotLucia = slots.find((s) => s.profesorId === "prof-lucia");
  if (slotLucia) {
    slotLucia.turnos.push({ materia: "Matemática", anio: "3° año", colegio: "IPEM 329" });
  }
  const slotCarlos = slots.find((s) => s.profesorId === "prof-carlos");
  if (slotCarlos) {
    slotCarlos.turnos.push(
      { materia: "Física", anio: "4° año", colegio: "IPEM 329" },
      { materia: "Física", anio: "4° año", colegio: "IPEM 329" }
    );
  }

  return slots;
}

export const MOCK_SLOTS: MockSlot[] = buildSlots();

// ── Queries mock (reemplazan queries a Supabase) ─────────────

/** Profesores que enseñan una materia en un nivel dado */
export function getProfesoresPorMateriaYNivel(
  materia: string,
  nivel: NivelEducativo
): ProfesorMock[] {
  return PROFESORES_MOCK.filter(
    (p) => p.materias.includes(materia) && p.niveles.includes(nivel)
  );
}

/** Materias disponibles para un nivel (solo las que tiene al menos un profesor) */
export function getMateriasPorNivel(nivel: NivelEducativo): string[] {
  const profesoresDelNivel = PROFESORES_MOCK.filter((p) => p.niveles.includes(nivel));
  const materiasConProfesor = new Set(profesoresDelNivel.flatMap((p) => p.materias));
  return MATERIAS_POR_NIVEL[nivel].filter((m) => materiasConProfesor.has(m));
}

/** Slots disponibles de un profesor (capacidad no llena) */
export function getSlotsPorProfesor(profesorId: string): MockSlot[] {
  return MOCK_SLOTS.filter(
    (s) => s.profesorId === profesorId && s.turnos.length < s.capacidad_max
  );
}
