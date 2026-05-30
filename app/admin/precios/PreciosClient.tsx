"use client";

import { useState, useTransition } from "react";
import { guardarPrecios, type PrecioInput } from "./actions";

// Esta página es un Client Component que carga los precios via server action al montar
// Para simplificar se renderiza directamente como client con datos precargados desde el server

type Precio = {
  nivel: string; valor_hora: number; porcentaje_profesor: number;
  pack_semanal_precio: number | null; pack_mensual_precio: number | null;
  pack_horas_semana: number | null; pack_horas_mes: number | null;
};

const NIVEL_LABELS: Record<string, string> = {
  primario: "Primario", secundario: "Secundario", terciario: "Terciario", taller: "Taller",
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);
}

export default function PreciosPageClient({ initialPrecios }: { initialPrecios: Precio[] }) {
  const [precios, setPrecios] = useState<Precio[]>(initialPrecios);
  const [pending, startTrans] = useTransition();
  const [saved, setSaved]     = useState(false);

  function update(nivel: string, field: keyof Precio, value: number | null) {
    setPrecios(prev => prev.map(p => p.nivel===nivel ? {...p, [field]:value} : p));
    setSaved(false);
  }

  function handleSave() {
    startTrans(async () => {
      await guardarPrecios(precios as PrecioInput[]);
      setSaved(true);
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border-2 border-[#e5e7eb] text-sm font-semibold text-[#374151] focus:border-[#7c3aed] outline-none text-right";

  return (
    <div className="space-y-5">
      {precios.map(p => {
        const montoProf = p.valor_hora * (p.porcentaje_profesor/100);
        const showPacks = p.nivel === "primario" || p.nivel === "secundario";
        return (
          <div key={p.nivel} className="bg-white rounded-2xl p-5 space-y-4" style={{boxShadow:"0 2px 12px rgba(124,58,237,0.07)"}}>
            <h2 className="text-base font-black text-[#1e1b4b]">{NIVEL_LABELS[p.nivel]}</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#374151] mb-1">Valor por hora</label>
                <input type="number" min={0} value={p.valor_hora} onChange={e=>update(p.nivel,"valor_hora",parseFloat(e.target.value)||0)} className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#374151] mb-1">% al profesor</label>
                <input type="number" min={0} max={100} value={p.porcentaje_profesor} onChange={e=>update(p.nivel,"porcentaje_profesor",parseFloat(e.target.value)||0)} className={inputCls}/>
              </div>
              <div className="flex items-end pb-0.5">
                <div className="w-full bg-[#f5f3ff] rounded-xl px-3 py-2 text-right">
                  <p className="text-[10px] font-extrabold text-[#9ca3af] uppercase">Pago al profe por hora</p>
                  <p className="text-base font-black text-[#7c3aed]">{fmtMoney(montoProf)}</p>
                </div>
              </div>
            </div>

            {showPacks && (
              <div className="border-t border-[#f3f4f6] pt-4">
                <p className="text-xs font-extrabold text-[#374151] mb-3">Packs / Precios especiales</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {p.nivel === "primario" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#9ca3af] mb-1">Pack semanal $</label>
                        <input type="number" min={0} value={p.pack_semanal_precio??0} onChange={e=>update(p.nivel,"pack_semanal_precio",parseFloat(e.target.value)||0)} className={inputCls}/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#9ca3af] mb-1">Clases/semana</label>
                        <input type="number" min={1} value={p.pack_horas_semana??0} onChange={e=>update(p.nivel,"pack_horas_semana",parseInt(e.target.value)||0)} className={inputCls}/>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] mb-1">Pack mensual $</label>
                    <input type="number" min={0} value={p.pack_mensual_precio??0} onChange={e=>update(p.nivel,"pack_mensual_precio",parseFloat(e.target.value)||0)} className={inputCls}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] mb-1">Clases/mes</label>
                    <input type="number" min={1} value={p.pack_horas_mes??0} onChange={e=>update(p.nivel,"pack_horas_mes",parseInt(e.target.value)||0)} className={inputCls}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={pending} className="px-6 py-3 rounded-xl bg-[#7c3aed] text-white font-black hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar precios"}
        </button>
        {saved && !pending && <span className="text-sm font-bold text-[#10b981]">✓ Guardado correctamente</span>}
      </div>
    </div>
  );
}
