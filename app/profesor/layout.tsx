import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfesorNavClient from "./_components/ProfesorNavClient";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single<{ rol: string; nombre: string }>();

  if (!profile || !["profesor", "admin"].includes(profile.rol)) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profesor" className="flex items-center gap-2">
              <span className="text-lg font-black text-[#7c3aed]">Educatopía</span>
              <span className="text-xs text-[#9ca3af] font-semibold hidden sm:inline">— Profesor</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#374151] hidden sm:inline">{profile.nombre}</span>
            <ProfesorNavClient />
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
          {[
            { href: "/profesor",                label: "Dashboard",       icon: "📊" },
            { href: "/profesor/calendario",    label: "Calendario",      icon: "🗓️"  },
            { href: "/profesor/turnos",        label: "Mis Turnos",      icon: "📅" },
            { href: "/profesor/disponibilidad", label: "Disponibilidad",  icon: "⏰" },
            { href: "/profesor/materias",        label: "Mis Materias",    icon: "📚" },
            { href: "/profesor/turnos-masivos", label: "Turnos Masivos",  icon: "⚡" },
            { href: "/profesor/liquidacion",   label: "Mi Liquidación",  icon: "💰" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-[#6b7280] hover:text-[#7c3aed] whitespace-nowrap border-b-2 border-transparent hover:border-[#7c3aed] transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
