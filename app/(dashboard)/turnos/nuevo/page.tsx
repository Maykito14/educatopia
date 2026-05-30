"use client";

import { useState } from "react";
import Image from "next/image";
import ProgressBar from "./components/ProgressBar";
import PasoAlumno from "./steps/PasoAlumno";
import PasoEstudio from "./steps/PasoEstudio";
import PasoSlot from "./steps/PasoSlot";
import PasoContacto from "./steps/PasoContacto";
import PasoConfirmar from "./steps/PasoConfirmar";
import { FORM_INITIAL, type FormData } from "./types";
import { formatFecha } from "./mock-data";
import { TurnosDataProvider, useTurnosData } from "./data-context";
import { submitTurno } from "@/app/actions/submit-turno";

type Errors = Partial<Record<keyof FormData, string>>;

function validate(step: number, data: FormData): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!data.nombre.trim())    e.nombre    = "Ingresá el nombre del alumno.";
    if (!data.apellido.trim())  e.apellido  = "Ingresá el apellido del alumno.";
    if (!data.edad)             e.edad      = "Ingresá la edad.";
    if (!data.colegio)          e.colegio   = "Seleccioná el colegio.";
    if (!data.nivelEducativo)   e.nivelEducativo = "Seleccioná el nivel educativo.";
  }
  if (step === 2) {
    if (!data.materia)  e.materia  = "Seleccioná una materia.";
    if (!data.objetivo) e.objetivo = "Seleccioná el objetivo.";
  }
  if (step === 3) {
    if (!data.slotId) e.slotId = "Seleccioná un turno disponible.";
  }
  if (step === 4) {
    if (!data.nombreContacto.trim()) e.nombreContacto = "Ingresá el nombre del responsable.";
    if (!data.whatsapp.trim())       e.whatsapp       = "Ingresá un número de WhatsApp.";
    if (!data.origen)                e.origen         = "Seleccioná cómo nos conociste.";
  }
  return e;
}

export default function NuevoTurnoPage() {
  return (
    <TurnosDataProvider>
      <NuevoTurnoForm />
    </TurnosDataProvider>
  );
}

function NuevoTurnoForm() {
  const { getSlotsPorProfesor, getProfesor, getSlot, refreshOcupacion } = useTurnosData();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(FORM_INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function onChange(patch: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...patch }));
    // Limpiar errores de los campos modificados
    const keys = Object.keys(patch) as (keyof FormData)[];
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }

  function next() {
    const errs = validate(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitError("");
    setSubmitLoading(true);

    const slot = getSlot(data.slotId);
    if (!slot) {
      setSubmitError("No se encontró el turno seleccionado. Volvé al paso 3.");
      setSubmitLoading(false);
      return;
    }

    const result = await submitTurno(data, slot);

    if (!result.success) {
      setSubmitError(result.error);
      setSubmitLoading(false);
      return;
    }

    // Actualizar ocupación para que otros vean el turno tomado
    await refreshOcupacion();
    setSubmitted(true);
    setSubmitLoading(false);
  }

  if (submitted) {
    const slot = getSlot(data.slotId);
    const prof = getProfesor(data.profesorId);
    return (
      <PantallaExito
        data={data}
        slotFecha={slot ? formatFecha(slot.fecha) : ""}
        slotHora={slot ? `${slot.hora_inicio} — ${slot.hora_fin}` : ""}
        profesorNombre={prof?.nombre ?? ""}
        metodoPago={data.metodoPago}
      />
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-5">
      {/* Header */}
      <div
        className="bg-white rounded-[20px] px-8 py-7 mb-5 text-center border-t-[6px] border-[#7c3aed] relative overflow-hidden"
        style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.1)" }}
      >
        {/* Decoraciones */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
          {[
            { size: 14, color: "#7c3aed", top: 15, left: 20 },
            { size: 10, color: "#10b981", top: 25, right: 30 },
            { size: 12, color: "#f59e0b", bottom: 20, left: 40 },
            { size: 8,  color: "#ef4444", bottom: 15, right: 25 },
          ].map((d, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{ width: d.size, height: d.size, background: d.color, top: "top" in d ? d.top : undefined, bottom: "bottom" in d ? d.bottom : undefined, left: "left" in d ? d.left : undefined, right: "right" in d ? d.right : undefined }}
            />
          ))}
        </div>

        <Image
          src="/logo.jpeg"
          alt="Educatopía"
          width={160}
          height={120}
          className="mx-auto mb-3 object-contain"
          priority
        />
        <h1 className="text-2xl font-black text-[#1e1b4b] mb-1.5">Solicitar turno</h1>
        <p className="text-sm text-[#6b7280] font-semibold leading-snug">
          Completá el formulario y elegí el horario que más te convenga.
        </p>
      </div>

      {/* Progress */}
      <ProgressBar current={step} />

      {/* Card del paso */}
      <div
        className="bg-white rounded-[20px] p-7 mb-4"
        style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.08)" }}
      >
        {step === 1 && <PasoAlumno   data={data} onChange={onChange} errors={errors} />}
        {step === 2 && <PasoEstudio  data={data} onChange={onChange} errors={errors} />}
        {step === 3 && <PasoSlot     data={data} onChange={onChange} errors={errors} />}
        {step === 4 && <PasoContacto data={data} onChange={onChange} errors={errors} />}
        {step === 5 && <PasoConfirmar data={data} onChange={onChange} />}

        {/* Error al confirmar */}
        {submitError && (
          <div className="mt-4 bg-[#fee2e2] text-[#ef4444] text-sm font-bold rounded-xl px-4 py-3">
            ⚠️ {submitError}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-4">
          {step > 1 && !submitLoading && (
            <button
              type="button"
              onClick={back}
              className="px-6 py-4 rounded-xl bg-[#f3f4f6] text-[#6b7280] font-extrabold text-lg hover:bg-[#e5e7eb] transition-colors"
            >
              ← Atrás
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 py-4 rounded-xl bg-[#7c3aed] text-white font-black text-lg hover:bg-[#6d28d9] transition-all hover:-translate-y-px"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitLoading}
              className="flex-1 py-4 rounded-xl bg-[#10b981] text-white font-black text-lg hover:bg-[#059669] transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Guardando…" : "✅ Confirmar turno"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PantallaExito({
  data,
  slotFecha,
  slotHora,
  profesorNombre,
  metodoPago,
}: {
  data: FormData;
  slotFecha: string;
  slotHora: string;
  profesorNombre: string;
  metodoPago: "transferencia" | "efectivo";
}) {
  const waTexto = metodoPago === "efectivo"
    ? `Hola! Acabo de solicitar un turno en Educatopía para ${data.nombre} ${data.apellido} 📚\nQuiero abonar el turno en efectivo.`
    : `Hola! Acabo de solicitar un turno en Educatopía para ${data.nombre} ${data.apellido} 📚\nTe envío el comprobante de la transferencia.`;
  return (
    <div className="max-w-[600px] mx-auto px-4 py-5">
      <div
        className="bg-white rounded-[20px] p-8 text-center"
        style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.1)" }}
      >
        <div className="text-[80px] mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-black text-[#1e1b4b] mb-2">¡Turno solicitado!</h2>
        <p className="text-sm text-[#6b7280] font-semibold leading-relaxed mb-6">
          Gracias por confiar en <strong>Educatopía</strong>. Nos ponemos en contacto
          a la brevedad para confirmar los detalles. 💜
        </p>

        <div className="bg-[#f5f3ff] rounded-2xl p-5 text-left mb-6">
          {[
            { label: "Alumno",   value: `${data.nombre} ${data.apellido}` },
            { label: "Materia",  value: data.materia },
            { label: "Profesor",  value: profesorNombre },
            { label: "Fecha",    value: slotFecha },
            { label: "Horario",  value: slotHora },
            { label: "Contacto", value: data.nombreContacto },
            { label: "WhatsApp", value: data.whatsapp },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-[#ede9fe] last:border-0 text-sm">
              <span className="font-bold text-[#9ca3af]">{label}</span>
              <span className="font-extrabold text-[#7c3aed]">{value}</span>
            </div>
          ))}
        </div>

        {metodoPago === "transferencia" && (
          <div className="bg-[#d1fae5] rounded-2xl px-5 py-4 mb-4 text-center border border-[#a7f3d0]">
            <p className="text-sm font-extrabold text-[#059669] mb-1">📎 Envianos el comprobante de pago</p>
            <p className="text-xs font-semibold text-[#6b7280] leading-snug">
              Para confirmar tu turno, compartí el comprobante de la transferencia al WhatsApp <strong className="text-[#1e1b4b]">3576481630</strong>
            </p>
          </div>
        )}

        <a
          href={`https://wa.me/5493576481630?text=${encodeURIComponent(waTexto)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl bg-[#25d366] text-white font-black text-lg mb-3"
        >
          💬 Último paso: Escribinos por WhatsApp
        </a>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-xl bg-[#ede9fe] text-[#7c3aed] font-black text-lg hover:bg-[#ddd6fe] transition-colors"
        >
          + Solicitar otro turno
        </button>
      </div>
    </div>
  );
}
