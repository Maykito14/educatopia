"use client";

import { useState, useTransition } from "react";
import { registrarCobro, aplicarSaldoAFavor, marcarCobrados } from "./actions";

type Precio = {
  nivel: string; valor_hora: number;
  pack_semanal_precio: number | null; pack_semanal_horas: number | null;
  pack_mensual_precio: number | null; pack_mensual_horas: number | null;
};
type TurnoCob = {
  id: string; materia: string; anio: string; cobrado: boolean;
  monto_cobrado: number | null;
  tipo_pedido: "suelto" | "pack_semanal" | "pack_mensual" | null;
  slot: { fecha: string; duracion_minutos: number } | null;
  alumno: {
    id: string; nombre: string; apellido: string;
    nivel_educativo: string | null;
    telefono_contacto: string | null;
    saldo_a_favor: number | null;
  } | null;
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function calcCostoTurno(t: TurnoCob, precioMap: Record<string, Precio>): number {
  const p = precioMap[t.alumno?.nivel_educativo ?? "secundario"] ?? precioMap["secundario"];
  if (!p) return 0;
  let vh = p.valor_hora;
  if (t.tipo_pedido === "pack_semanal" && p.pack_semanal_precio && p.pack_semanal_horas) {
    vh = p.pack_semanal_precio / p.pack_semanal_horas;
  } else if (t.tipo_pedido === "pack_mensual" && p.pack_mensual_precio && p.pack_mensual_horas) {
    vh = p.pack_mensual_precio / p.pack_mensual_horas;
  }
  return (t.slot?.duracion_minutos ?? 60) / 60 * vh;
}

function BadgeEstado({ montoCobrado, costo }: { montoCobrado: number | null; costo: number }) {
  if (!montoCobrado || montoCobrado <= 0) {
    return <span className="text-[10px] font-black px-2 py-0.5 bg-[#fef3c7] text-[#d97706] rounded-full whitespace-nowrap">⏳ Pendiente</span>;
  }
  if (montoCobrado >= costo) {
    return <span className="text-[10px] font-black px-2 py-0.5 bg-[#d1fae5] text-[#059669] rounded-full whitespace-nowrap">✓ Cobrado</span>;
  }
  const pct = Math.round((montoCobrado / costo) * 100);
  return <span className="text-[10px] font-black px-2 py-0.5 bg-[#e0e7ff] text-[#4338ca] rounded-full whitespace-nowrap">◑ {pct}% pagado</span>;
}

function TurnoRow({
  t, costo, saldoAlumno, onCobrar, onAplicarSaldo,
}: {
  t: TurnoCob;
  costo: number;
  saldoAlumno: number;
  onCobrar: (montoCobrado: number) => Promise<void>;
  onAplicarSaldo: () => Promise<void>;
}) {
  const montoYaPagado = t.monto_cobrado ?? 0;
  const restante = Math.max(0, costo - montoYaPagado);
  const [modo, setModo] = useState<"idle" | "parcial">("idle");
  const [input, setInput] = useState("");
  const [pending, startTrans] = useTransition();

  const montoParcial = parseFloat(input.replace(",", ".")) || 0;
  const excedente = montoParcial - restante;
  const hayExcedente = restante > 0 && excedente > 0;

  function handleTotal() {
    startTrans(() => onCobrar(costo));
  }

  function handleParcial() {
    if (montoParcial <= 0) return;
    startTrans(() => onCobrar(montoYaPagado + montoParcial));
    setModo("idle");
    setInput("");
  }

  return (
    <tr className="border-b border-[#f9fafb] last:border-0 hover:bg-[#fafafa]">
      <td className="px-4 py-2.5 text-xs text-[#9ca3af] font-semibold whitespace-nowrap">
        {t.slot ? fmtDate(t.slot.fecha) : "—"}
      </td>
      <td className="px-3 py-2.5 text-xs font-bold text-[#374151]">
        {t.materia}
        {t.anio && <span className="text-[#9ca3af] ml-1">· {t.anio}</span>}
      </td>
      <td className="px-3 py-2.5 text-xs text-[#9ca3af] font-semibold text-center whitespace-nowrap">
        {((t.slot?.duracion_minutos ?? 60) / 60).toFixed(1)} hs
      </td>
      <td className="px-3 py-2.5 text-xs font-extrabold text-[#1e1b4b] whitespace-nowrap">
        {fmtMoney(costo)}
        {montoYaPagado > 0 && montoYaPagado < costo && (
          <div className="text-[10px] font-semibold text-[#4338ca] mt-0.5">
            Pagado: {fmtMoney(montoYaPagado)} · Resta: {fmtMoney(restante)}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        {modo === "idle" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" disabled={pending}
              onClick={handleTotal}
              className="px-3 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-black hover:bg-[#047857] transition-colors disabled:opacity-50 whitespace-nowrap">
              ✓ Cobro Total
            </button>
            <button type="button" disabled={pending}
              onClick={() => { setModo("parcial"); setInput(""); }}
              className="px-3 py-1.5 rounded-lg border-2 border-[#7c3aed] text-[#7c3aed] bg-white text-xs font-black hover:bg-[#ede9fe] transition-colors disabled:opacity-50 whitespace-nowrap">
              ◑ Cobro Parcial
            </button>
            {saldoAlumno > 0 && restante > 0 && (
              <button type="button" disabled={pending}
                onClick={() => startTrans(() => onAplicarSaldo())}
                className="px-2 py-1.5 rounded-lg border-2 border-[#059669] bg-[#f0fdf4] text-[#059669] text-[10px] font-black hover:bg-[#dcfce7] transition-colors disabled:opacity-50 whitespace-nowrap"
                title={`Aplicar saldo disponible: ${fmtMoney(saldoAlumno)}`}>
                ✦ Usar saldo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9ca3af] font-bold pointer-events-none">$</span>
                <input type="number" min={0} step={100} autoFocus
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={String(Math.round(restante))}
                  className={`w-28 pl-5 pr-2 py-1.5 rounded-lg border-2 text-xs font-extrabold outline-none transition-colors ${
                    hayExcedente ? "border-[#059669] text-[#059669] bg-[#f0fdf4]" : "border-[#7c3aed] text-[#374151]"
                  }`}
                />
              </div>
              <button type="button" disabled={pending || montoParcial <= 0}
                onClick={handleParcial}
                className="px-3 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
                {pending ? "…" : "Confirmar"}
              </button>
              <button type="button" onClick={() => setModo("idle")}
                className="text-[10px] font-semibold text-[#9ca3af] underline hover:text-[#374151]">
                Cancelar
              </button>
            </div>
            {hayExcedente && (
              <p className="text-[10px] font-semibold text-[#059669]">
                ✦ Excedente {fmtMoney(excedente)} → saldo a favor
              </p>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5">
        <BadgeEstado montoCobrado={t.monto_cobrado} costo={costo} />
      </td>
    </tr>
  );
}

type SaldoRow = { id: string; nombre: string; apellido: string; saldo_a_favor: number };

function SaldosAFavorSection({ saldos }: { saldos: SaldoRow[] }) {
  if (saldos.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
      <div className="px-5 py-3 bg-[#f0fdf4] border-b border-[#bbf7d0] flex items-center gap-2">
        <span className="text-base">✦</span>
        <div>
          <p className="font-extrabold text-[#059669] text-sm">Saldos a favor</p>
          <p className="text-xs text-[#6b7280] font-semibold">
            Crédito acumulado disponible para aplicar en el próximo turno de cada alumno.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-[#f3f4f6]">
        {saldos.map(s => (
          <li key={s.id} className="px-5 py-3 flex items-center justify-between">
            <p className="font-extrabold text-[#1e1b4b] text-sm">{s.apellido}, {s.nombre}</p>
            <span className="text-sm font-black text-[#059669] bg-[#d1fae5] px-3 py-1 rounded-full">
              {fmtMoney(s.saldo_a_favor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CobranzasClient({
  turnos, precios, saldos,
}: { turnos: TurnoCob[]; precios: Precio[]; saldos: SaldoRow[] }) {
  const precioMap: Record<string, Precio> = {};
  precios.forEach(p => { precioMap[p.nivel] = p; });

  const grupos: Record<string, { alumno: TurnoCob["alumno"]; turnos: TurnoCob[] }> = {};
  for (const t of turnos) {
    const key = t.alumno?.id ?? "unknown";
    if (!grupos[key]) grupos[key] = { alumno: t.alumno, turnos: [] };
    grupos[key].turnos.push(t);
  }

  const totalPendiente = turnos.reduce((acc, t) => {
    const costo = calcCostoTurno(t, precioMap);
    return acc + costo - (t.monto_cobrado ?? 0);
  }, 0);

  if (turnos.length === 0 && saldos.length === 0) {
    return (
      <div className="text-center py-16 text-[#9ca3af] font-bold bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
        Sin cobros pendientes. ¡Todo al día! 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen global */}
      {turnos.length > 0 && (
      <div className="bg-[#f5f3ff] rounded-2xl p-4">
        <p className="text-xs font-extrabold text-[#9ca3af]">Total pendiente de cobrar</p>
        <p className="text-2xl font-black text-[#7c3aed]">{fmtMoney(totalPendiente)}</p>
        <p className="text-xs text-[#9ca3af] font-semibold mt-1">
          Podés registrar cobros totales, parciales o con excedente (saldo a favor).
        </p>
      </div>
      )}

      {/* Saldos a favor */}
      <SaldosAFavorSection saldos={saldos} />

      {Object.entries(grupos).map(([key, { alumno, turnos: gTurnos }]) => {
        const saldo = alumno?.saldo_a_favor ?? 0;
        const totalGrupo = gTurnos.reduce((acc, t) => {
          return acc + calcCostoTurno(t, precioMap) - (t.monto_cobrado ?? 0);
        }, 0);

        return (
          <div key={key} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.07)" }}>
            {/* Header alumno */}
            <div className="px-5 py-3 bg-[#faf5ff] flex items-center justify-between border-b border-[#e5e7eb] flex-wrap gap-2">
              <div>
                <p className="font-extrabold text-[#1e1b4b]">{alumno?.nombre} {alumno?.apellido}</p>
                {alumno?.telefono_contacto && (
                  <p className="text-xs text-[#9ca3af] font-semibold">💬 {alumno.telefono_contacto}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {saldo > 0 && (
                  <span className="text-xs font-black px-3 py-1 bg-[#d1fae5] text-[#059669] rounded-full">
                    ✦ Saldo a favor: {fmtMoney(saldo)}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-xs text-[#9ca3af] font-semibold">{gTurnos.length} turno{gTurnos.length !== 1 ? "s" : ""}</p>
                  <p className="text-base font-black text-[#7c3aed]">{fmtMoney(totalGrupo)}</p>
                </div>
              </div>
            </div>

            {/* Tabla de turnos */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    {["Fecha", "Materia", "Duración", "Costo turno", "Importe cobrado", "Estado"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-[#9ca3af] uppercase tracking-wide first:pl-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gTurnos.map(t => {
                    const costo = calcCostoTurno(t, precioMap);
                    return (
                      <TurnoRow
                        key={t.id}
                        t={t}
                        costo={costo}
                        saldoAlumno={saldo}
                        onCobrar={(montoCobrado) =>
                          registrarCobro(t.id, montoCobrado, costo, alumno?.id ?? "")
                        }
                        onAplicarSaldo={() =>
                          aplicarSaldoAFavor(
                            alumno?.id ?? "",
                            t.id,
                            saldo,
                            costo,
                            t.monto_cobrado ?? 0
                          )
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
