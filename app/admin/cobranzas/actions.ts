"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

function revalidate() {
  revalidatePath("/admin/cobranzas");
  revalidatePath("/admin");
}

/**
 * Registra el importe cobrado para un turno.
 * - Si montoCobrado >= costoTurno: marca cobrado = true
 * - Si montoCobrado > costoTurno: el excedente se suma al saldo_a_favor del alumno
 * - Si montoCobrado < costoTurno: cobrado = false (pago parcial)
 */
export async function registrarCobro(
  turnoId: string,
  montoCobrado: number,
  costoTurno: number,
  alumnoId: string
) {
  const supabase = createServiceClient();
  const cobrado = montoCobrado >= costoTurno;
  const excedente = montoCobrado - costoTurno;

  await supabase
    .from("turnos")
    .update({ monto_cobrado: montoCobrado, cobrado })
    .eq("id", turnoId);

  if (excedente > 0) {
    await supabase.rpc("incrementar_saldo_a_favor", {
      p_alumno_id: alumnoId,
      p_monto: excedente,
    });
  }

  revalidate();
}

/**
 * Aplica el saldo_a_favor del alumno al turno indicado.
 * Descuenta del saldo lo necesario para completar (o cubrir) el pago.
 */
export async function aplicarSaldoAFavor(
  alumnoId: string,
  turnoId: string,
  saldoDisponible: number,
  costoTurno: number,
  montoYaCobrado: number
) {
  const supabase = createServiceClient();
  const restante = costoTurno - montoYaCobrado;
  const aAplicar = Math.min(saldoDisponible, restante);
  if (aAplicar <= 0) return;

  const nuevoMonto = montoYaCobrado + aAplicar;
  const cobrado = nuevoMonto >= costoTurno;

  await Promise.all([
    supabase
      .from("turnos")
      .update({ monto_cobrado: nuevoMonto, cobrado })
      .eq("id", turnoId),
    supabase.rpc("incrementar_saldo_a_favor", {
      p_alumno_id: alumnoId,
      p_monto: -aAplicar,
    }),
  ]);

  revalidate();
}

/** Marca múltiples turnos como cobrados al 100% (sin registrar monto exacto). */
export async function marcarCobrados(turnoIds: string[]) {
  if (turnoIds.length === 0) return;
  await createServiceClient()
    .from("turnos")
    .update({ cobrado: true })
    .in("id", turnoIds);
  revalidate();
}
