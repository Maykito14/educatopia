"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { NivelEducativo, ProfesorMock, MockSlot } from "./types";
import { buildSlotsFromProfesores } from "./mock-data";

// ── Tipos devueltos por la API ────────────────────────────────

interface SlotOcupacion {
  profesor_id:      string;
  fecha:            string;
  hora_inicio:      string;
  duracion_minutos: number;
  ocupados:         number;
  grupos:           { materia: string; anio: string; colegio: string }[];
}

interface BloqueoAPI {
  profesor_id: string;
  fecha:       string;
  hora_inicio: string | null;  // null = día completo
  hora_fin:    string | null;
}

function slotEstaBloqueado(slot: MockSlot, bloqueos: BloqueoAPI[]): boolean {
  return bloqueos.some(b => {
    if (b.profesor_id !== slot.profesorId || b.fecha !== slot.fecha) return false;
    if (!b.hora_inicio || !b.hora_fin) return true; // día completo
    // Solapamiento: el slot se solapa si empieza antes de que termine el bloqueo
    // y termina después de que empieza el bloqueo
    return slot.hora_inicio < b.hora_fin && slot.hora_fin > b.hora_inicio;
  });
}

// ── Precios ───────────────────────────────────────────────────

export interface PrecioNivel {
  nivel:      string;
  valor_hora: number;
}

/** Formatea en pesos argentinos sin decimales */
export function fmtPesos(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

/** Alias de transferencia según nivel y nombre del profesor */
export function getAlias(nivel: string, profesorNombre: string): string {
  if (nivel === "primario") return "educatopia.primario";
  if (nivel === "taller")   return "florchiambretto.nx";
  // secundario / terciario
  const lower = profesorNombre.toLowerCase();
  if (lower.includes("marlen")) return "secu.educatopia";
  return "florchiambretto.nx"; // profemayco + otros
}

// ── Context type ─────────────────────────────────────────────

interface TurnosDataCtx {
  loading: boolean;
  colegios: string[];
  precios: PrecioNivel[];
  getMateriasPorNivel:          (nivel: NivelEducativo) => string[];
  getProfesoresPorMateriaYNivel: (materia: string, nivel: NivelEducativo) => ProfesorMock[];
  getSlotsPorProfesor:          (profesorId: string) => MockSlot[];
  getProfesor:                  (id: string) => ProfesorMock | undefined;
  getSlot:                      (slotId: string) => MockSlot | undefined;
  /** Devuelve el valor por hora para un nivel dado (0 si no está configurado) */
  getValorHora:                 (nivel: string) => number;
  refreshOcupacion:             () => Promise<void>;
}

const Ctx = createContext<TurnosDataCtx | null>(null);

export function useTurnosData(): TurnosDataCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTurnosData must be used inside TurnosDataProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────

export function TurnosDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading]       = useState(true);
  const [colegios, setColegios]     = useState<string[]>([]);
  const [profesores, setProfesores] = useState<ProfesorMock[]>([]);
  const [precios, setPrecios]       = useState<PrecioNivel[]>([]);
  const [ocupacion, setOcupacion]   = useState<SlotOcupacion[]>([]);
  const [materiaMap, setMateriaMap] = useState<
    Map<string, Map<NivelEducativo, ProfesorMock[]>>
  >(new Map());

  const [bloqueos, setBloqueos] = useState<BloqueoAPI[]>([]);

  const loadOcupacion = useCallback(async () => {
    try {
      const res = await fetch("/api/slots-ocupacion");
      if (res.ok) {
        const json = await res.json();
        setOcupacion(json.ocupacion ?? []);
        setBloqueos(json.bloqueos ?? []);
        // precios vienen de service role (la tabla requiere auth para leerse)
        if (Array.isArray(json.precios)) setPrecios(json.precios as PrecioNivel[]);
      }
    } catch {
      // silencioso — los slots se muestran vacíos si falla
    }
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [colegiosRes, profesoresRes] = await Promise.all([
        supabase
          .from("colegios")
          .select("nombre")
          .eq("activo", true)
          .order("orden"),
        supabase
          .from("profesores")
          .select(`
            id, nombre,
            materias_join:profesores_materias(
              materia:materias(nombre, nivel)
            ),
            disponibilidad:profesores_disponibilidad(
              dia_semana, hora_inicio, hora_fin, activo
            )
          `)
          .eq("activo", true),
      ]);

      type ProfesorRow = {
        id: string;
        nombre: string;
        materias_join: { materia: { nombre: string; nivel: string } | null }[];
        disponibilidad: { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[];
      };
      type ColegioRow = { nombre: string };

      setColegios(((colegiosRes.data ?? []) as ColegioRow[]).map((c) => c.nombre));

      const profList: ProfesorMock[] = [];
      const map = new Map<string, Map<NivelEducativo, ProfesorMock[]>>();

      for (const p of (profesoresRes.data ?? []) as ProfesorRow[]) {
        const prof: ProfesorMock = {
          id: p.id,
          nombre: p.nombre,
          materias: [],
          niveles: [],
          disponibilidad: (p.disponibilidad ?? [])
            .filter((d) => d.activo)
            .map((d) => ({
              dia:        d.dia_semana,
              hora_inicio: d.hora_inicio.slice(0, 5),
              hora_fin:    d.hora_fin.slice(0, 5),
            })),
        };

        const materiasSet = new Set<string>();
        const nivelesSet  = new Set<NivelEducativo>();

        for (const mj of p.materias_join ?? []) {
          const mat = mj.materia;
          if (!mat) continue;
          materiasSet.add(mat.nombre);
          nivelesSet.add(mat.nivel as NivelEducativo);

          if (!map.has(mat.nombre)) map.set(mat.nombre, new Map());
          const nivelMap = map.get(mat.nombre)!;
          const nivel    = mat.nivel as NivelEducativo;
          if (!nivelMap.has(nivel)) nivelMap.set(nivel, []);
          const list = nivelMap.get(nivel)!;
          if (!list.find((x) => x.id === prof.id)) list.push(prof);
        }

        prof.materias = [...materiasSet];
        prof.niveles  = [...nivelesSet];
        profList.push(prof);
      }

      setProfesores(profList);
      setMateriaMap(map);

      // Cargar ocupación real en paralelo (no bloquea)
      await loadOcupacion();
      setLoading(false);
    }

    load();
  }, [loadOcupacion]);

  // Slots generados (sin ocupación)
  const baseSlots = useMemo(() => buildSlotsFromProfesores(profesores), [profesores]);

  // Fusionar ocupación real en los slots generados
  const allSlots = useMemo(() => {
    if (ocupacion.length === 0) return baseSlots;

    // Clave de matching: profesorId|fecha|hhmm|duracion
    const ocMap = new Map<string, SlotOcupacion>();
    for (const o of ocupacion) {
      const hhmm = o.hora_inicio.slice(0, 5).replace(":", "");
      ocMap.set(`${o.profesor_id}|${o.fecha}|${hhmm}|${o.duracion_minutos}`, o);
    }

    return baseSlots.map((s) => {
      const hhmm = s.hora_inicio.replace(":", "");
      const key  = `${s.profesorId}|${s.fecha}|${hhmm}|${s.duracion_minutos}`;
      const oc   = ocMap.get(key);
      if (!oc) return s;
      return { ...s, turnos: oc.grupos };
    });
  }, [baseSlots, ocupacion]);

  const value = useMemo<TurnosDataCtx>(
    () => ({
      loading,
      colegios,
      precios,
      getValorHora: (nivel) =>
        precios.find((p) => p.nivel === nivel)?.valor_hora ?? 0,
      getMateriasPorNivel: (nivel) => {
        const names: string[] = [];
        for (const [materia, nivelMap] of materiaMap) {
          if (nivelMap.has(nivel)) names.push(materia);
        }
        return names.sort();
      },
      getProfesoresPorMateriaYNivel: (materia, nivel) =>
        materiaMap.get(materia)?.get(nivel) ?? [],
      getSlotsPorProfesor: (profesorId) =>
        allSlots.filter(
          (s) =>
            s.profesorId === profesorId &&
            s.turnos.length < s.capacidad_max &&
            !slotEstaBloqueado(s, bloqueos)
        ),
      getProfesor: (id)     => profesores.find((p) => p.id === id),
      getSlot:     (slotId) => allSlots.find((s) => s.id === slotId),
      refreshOcupacion:      loadOcupacion,
    }),
    [loading, colegios, precios, materiaMap, allSlots, profesores, loadOcupacion, bloqueos]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
