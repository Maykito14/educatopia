"use client";

import { useState } from "react";
import { formatFecha } from "../mock-data";
import { useTurnosData, fmtPesos } from "../data-context";
import type { FormData, MockSlot, NivelEducativo } from "../types";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

function tieneGrupo(slot: MockSlot, data: FormData) {
  if (!data.materia || !data.anioGrado || !data.colegio) return false;
  return slot.turnos.some(
    (t) =>
      t.materia === data.materia &&
      t.anio === data.anioGrado &&
      t.colegio === data.colegio &&
      (data.nivelEducativo !== "secundario" || (t.especialidad ?? "") === data.especialidad)
  );
}

export default function PasoSlot({ data, onChange, errors }: Props) {
  const { loading, getMateriasPorNivel, getProfesoresPorMateriaYNivel, getProfesoresPorNivel, getSlotsPorProfesor, getSlot, getValorHora } = useTurnosData();

  const esPack      = data.tipoPedido !== "suelto";
  const diasRango   = data.tipoPedido === "pack_semanal" ? 7 : 28;
  const minHorasPack = data.tipoPedido === "pack_semanal" ? 3 : 12;

  // "Otras": materia libre que no está en el catálogo → mostrar todos los profes del nivel
  const nivel = data.nivelEducativo as NivelEducativo | "";
  const materiasDelNivel = nivel ? getMateriasPorNivel(nivel as NivelEducativo) : [];
  const esOtras = !!data.materia && !!nivel && !materiasDelNivel.includes(data.materia);

  // Precio estimado para el slot seleccionado (suelto)
  const selectedSlot = data.slotId ? getSlot(data.slotId) : null;
  const valorHora    = getValorHora(data.nivelEducativo);
  const montoEstimado = selectedSlot && valorHora > 0
    ? (selectedSlot.duracion_minutos / 60) * valorHora
    : null;

  // Totales para pack
  const totalMinutosPack = data.slotIds.reduce((acc, id) => {
    const s = getSlot(id);
    return acc + (s?.duracion_minutos ?? 0);
  }, 0);
  const totalHorasPack = totalMinutosPack / 60;
  const montoPack      = valorHora > 0 ? (totalMinutosPack / 60) * valorHora : null;
  const packCompleto   = totalHorasPack >= minHorasPack;

  // Filtrar slots por rango de días para pack
  function filtrarPorRango(slots: MockSlot[]): MockSlot[] {
    if (!esPack) return slots;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy); limite.setDate(hoy.getDate() + diasRango - 1);
    return slots.filter(s => {
      const d = new Date(s.fecha + "T00:00:00");
      return d >= hoy && d <= limite;
    });
  }

  // Toggle slot en modo pack
  function togglePackSlot(profId: string, slotId: string) {
    if (data.profesorId && data.profesorId !== profId) {
      // Cambia de profesor: reinicia selección
      onChange({ profesorId: profId, slotIds: [slotId] });
      return;
    }
    const inList = data.slotIds.includes(slotId);
    if (inList) {
      const next = data.slotIds.filter(id => id !== slotId);
      onChange({ slotIds: next, profesorId: next.length > 0 ? profId : "" });
    } else {
      onChange({ profesorId: profId, slotIds: [...data.slotIds, slotId] });
    }
  }

  // clave: `${profesorId}-${fecha}` → expandido o no
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleDia(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const alumnoIdentidad = data.nombre && data.apellido
    ? { nombre: data.nombre, apellido: data.apellido }
    : undefined;

  const profesores =
    data.materia && nivel
      ? esOtras
        ? getProfesoresPorNivel(nivel as NivelEducativo, alumnoIdentidad)
        : getProfesoresPorMateriaYNivel(data.materia, nivel as NivelEducativo, alumnoIdentidad)
      : [];

  if (loading) {
    return (
      <div className="text-center py-10 text-[#9ca3af] font-bold">
        Cargando disponibilidad…
      </div>
    );
  }

  if (!data.materia || !data.nivelEducativo) {
    return (
      <div className="text-center py-10 text-[#9ca3af] font-bold">
        Completá los pasos anteriores para ver los turnos disponibles.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 text-lg font-black text-[#1e1b4b] mb-2">
        <div className="w-10 h-10 rounded-[10px] bg-[#fef3c7] flex items-center justify-center text-xl flex-shrink-0">
          📅
        </div>
        {esPack ? "Elegí los turnos del pack" : "Elegí tu turno"}
      </div>
      <p className="text-sm text-[#6b7280] font-semibold mb-3">
        {esPack
          ? <>Seleccioná múltiples turnos de <strong>{diasRango} días</strong> para <strong>{data.materia}</strong></>
          : <>Turnos disponibles para <strong>{data.materia}</strong></>
        }
      </p>

      {errors.slotId && (
        <p className="text-xs font-bold text-[#ef4444] mb-3">{errors.slotId}</p>
      )}

      {/* Barra de horas mínimas — solo en modo pack */}
      {esPack && (
        <div className="bg-[#f5f3ff] rounded-xl px-4 py-3 mb-4 border border-[#ede9fe]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-[#7c3aed]">
              {packCompleto ? "✅ Mínimo alcanzado" : `⏱ Horas seleccionadas`}
            </span>
            <span className={`text-sm font-black ${packCompleto ? "text-[#059669]" : "text-[#7c3aed]"}`}>
              {totalHorasPack.toFixed(1)} / {minHorasPack} hs
            </span>
          </div>
          <div className="w-full bg-[#e5e7eb] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${packCompleto ? "bg-[#10b981]" : "bg-[#7c3aed]"}`}
              style={{ width: `${Math.min(100, (totalHorasPack / minHorasPack) * 100)}%` }}
            />
          </div>
          {montoPack !== null && data.slotIds.length > 0 && (
            <p className="text-xs font-bold text-[#047857] mt-2">
              💰 Total estimado: <strong>{fmtPesos(montoPack)}</strong> · {data.slotIds.length} turno{data.slotIds.length !== 1 ? "s" : ""} seleccionado{data.slotIds.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Monto estimado — solo en modo suelto al seleccionar un turno */}
      {!esPack && montoEstimado !== null && (
        <div className="flex items-center gap-3 bg-[#d1fae5] rounded-xl px-4 py-3 mb-4 border border-[#a7f3d0]">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs font-extrabold text-[#059669] uppercase tracking-wide">Total a abonar</p>
            <p className="text-xl font-black text-[#047857]">{fmtPesos(montoEstimado)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold text-[#6b7280]">
              {selectedSlot!.duracion_minutos} min · {fmtPesos(valorHora)}/h
            </p>
          </div>
        </div>
      )}

      {profesores.length === 0 ? (
        <div className="bg-[#fee2e2] rounded-xl px-4 py-3 text-sm font-bold text-[#ef4444]">
          No hay profesores disponibles para esa materia y nivel.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {profesores.map((prof) => {
            const slotsRaw = filtrarPorRango(getSlotsPorProfesor(prof.id));
            const profSeleccionado = data.profesorId === prof.id;

            // Agrupar por fecha → hora_inicio → slots
            const porFecha = slotsRaw.reduce<Record<string, Record<string, MockSlot[]>>>(
              (acc, s) => {
                if (!acc[s.fecha]) acc[s.fecha] = {};
                if (!acc[s.fecha][s.hora_inicio]) acc[s.fecha][s.hora_inicio] = [];
                acc[s.fecha][s.hora_inicio].push(s);
                return acc;
              },
              {}
            );
            const fechas = Object.keys(porFecha).sort();

            return (
              <div
                key={prof.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  profSeleccionado ? "border-[#7c3aed]" : "border-[#e5e7eb]"
                }`}
                style={{
                  boxShadow: profSeleccionado
                    ? "0 0 0 3px rgba(124,58,237,0.1)"
                    : undefined,
                }}
              >
                {/* Header — solo nombre del profesor */}
                <div className="bg-[#f5f3ff] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                    {prof.nombre.split(" ").slice(-1)[0][0]}
                  </div>
                  <p className="font-black text-[#1e1b4b]">{prof.nombre}</p>
                </div>

                {/* Lista de días colapsables */}
                <div className="divide-y divide-[#f3f4f6]">
                  {fechas.length === 0 && (
                    <p className="text-sm text-[#9ca3af] font-semibold text-center py-4 px-4">
                      Sin turnos disponibles en los próximos {diasRango} días.
                    </p>
                  )}

                  {fechas.map((fecha) => {
                    const key = `${prof.id}-${fecha}`;
                    const open = expanded[key] ?? false;
                    const horasDelDia = Object.keys(porFecha[fecha]).sort();

                    // ¿Algún slot de este día tiene agrupamiento?
                    const hayGrupo = Object.values(porFecha[fecha])
                      .flat()
                      .some((s) => tieneGrupo(s, data));

                    // ¿Está seleccionado un slot de este día?
                    const diaSeleccionado = esPack
                      ? Object.values(porFecha[fecha]).flat().some(s => data.slotIds.includes(s.id))
                      : Object.values(porFecha[fecha]).flat().some(s => s.id === data.slotId);

                    return (
                      <div key={fecha}>
                        {/* Encabezado del día — clickeable */}
                        <button
                          type="button"
                          onClick={() => toggleDia(key)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#faf5ff] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-extrabold capitalize ${
                                diaSeleccionado ? "text-[#7c3aed]" : "text-[#1e1b4b]"
                              }`}
                            >
                              {formatFecha(fecha)}
                            </span>
                            {diaSeleccionado && (
                              <span className="text-xs font-black text-[#7c3aed]">✓</span>
                            )}
                            {hayGrupo && !diaSeleccionado && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#059669]">
                                🤝 grupo disponible
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#9ca3af] font-semibold">
                              {horasDelDia.length} horarios
                            </span>
                            <span
                              className="text-[#9ca3af] transition-transform duration-200"
                              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                            >
                              ▾
                            </span>
                          </div>
                        </button>

                        {/* Panel de horarios */}
                        {open && (
                          <div className="px-4 pb-4 pt-1 flex flex-col gap-2 bg-white">
                            {horasDelDia.map((horaInicio) => (
                              <div key={horaInicio} className="flex items-center gap-2 flex-wrap">
                                {/* Hora de inicio */}
                                <span className="text-sm font-black text-[#374151] w-12 flex-shrink-0">
                                  {horaInicio}
                                </span>

                                {/* Botones 1h y 1:30h */}
                                {porFecha[fecha][horaInicio]
                                  .sort((a, b) => a.duracion_minutos - b.duracion_minutos)
                                  .map((slot) => {
                                    const selected = esPack
                                      ? data.slotIds.includes(slot.id)
                                      : data.slotId === slot.id;
                                    const grupo    = tieneGrupo(slot, data);
                                    const libres   = slot.capacidad_max - slot.turnos.length;
                                    const durLabel = slot.duracion_minutos === 60 ? "1 h" : "1:30 h";
                                    const monto    = valorHora > 0
                                      ? (slot.duracion_minutos / 60) * valorHora
                                      : null;

                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() =>
                                          esPack
                                            ? togglePackSlot(prof.id, slot.id)
                                            : onChange({ profesorId: prof.id, slotId: slot.id })
                                        }
                                        className={`relative flex flex-col items-center px-3 py-2 rounded-xl border-2 text-sm font-black transition-all min-w-[90px] ${
                                          selected
                                            ? "border-[#7c3aed] bg-[#ede9fe] text-[#7c3aed]"
                                            : "border-[#e5e7eb] text-[#1e1b4b] hover:border-[#7c3aed] hover:bg-[#faf5ff]"
                                        }`}
                                      >
                                        <span className="text-xs text-[#6b7280] font-bold">
                                          hasta {slot.hora_fin}
                                        </span>
                                        <span className="font-extrabold">{durLabel}</span>

                                        {/* Precio del slot */}
                                        {monto !== null && (
                                          <span className={`text-[10px] font-black mt-0.5 ${
                                            selected ? "text-[#7c3aed]" : "text-[#059669]"
                                          }`}>
                                            {fmtPesos(monto)}
                                          </span>
                                        )}

                                        {/* dots capacidad */}
                                        <div className="flex gap-0.5 mt-1">
                                          {Array.from({ length: slot.capacidad_max }).map((_, i) => (
                                            <div
                                              key={i}
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{
                                                background:
                                                  i < slot.turnos.length ? "#7c3aed" : "#e5e7eb",
                                              }}
                                            />
                                          ))}
                                        </div>

                                        {grupo && (
                                          <span className="absolute -top-2 -right-2 bg-[#10b981] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            🤝 grupo
                                          </span>
                                        )}
                                        {libres === 1 && !grupo && (
                                          <span className="text-[9px] font-bold text-[#f59e0b] mt-0.5">
                                            ¡Último!
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
