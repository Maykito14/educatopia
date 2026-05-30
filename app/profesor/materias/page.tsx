import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import MateriasClient from "./MateriasClient";

export default async function MateriasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profesor } = await supabase
    .from("profesores")
    .select("id, nombre")
    .eq("profile_id", user.id)
    .single<{ id: string; nombre: string }>();

  if (!profesor) redirect("/profesor");

  const service = createServiceClient();

  const [allMateriasRes, misMateriasRes] = await Promise.all([
    service
      .from("materias")
      .select("id, nombre, nivel")
      .eq("activo", true)
      .order("nivel")
      .order("nombre"),
    service
      .from("profesores_materias")
      .select("materia_id")
      .eq("profesor_id", profesor.id),
  ]);

  const selectedIds = (misMateriasRes.data ?? []).map((r: { materia_id: string }) => r.materia_id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-[#1e1b4b]">Mis Materias</h1>
        <p className="text-sm text-[#6b7280] font-semibold">
          Seleccioná las materias y niveles que dictás. Los alumnos solo verán turnos para estas combinaciones.
        </p>
      </div>
      <MateriasClient
        allMaterias={allMateriasRes.data ?? []}
        selectedIds={selectedIds}
      />
    </div>
  );
}
