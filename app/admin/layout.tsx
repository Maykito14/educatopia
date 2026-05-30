import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminNavClient from "./_components/AdminNavClient";

const TABS = [
  { href: "/admin",               label: "Dashboard",      icon: "📊" },
  { href: "/admin/calendario",    label: "Calendario",     icon: "🗓️"  },
  { href: "/admin/turnos",        label: "Turnos",         icon: "📋" },
  { href: "/admin/turnos-masivos",label: "Turnos Masivos", icon: "⚡" },
  { href: "/admin/liquidacion",   label: "Liquidación",    icon: "💰" },
  { href: "/admin/cobranzas",     label: "Cobranzas",      icon: "📥" },
  { href: "/admin/precios",       label: "Precios",        icon: "🏷️"  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("rol, nombre").eq("id", user.id)
    .single<{ rol: string; nombre: string }>();

  if (!profile || profile.rol !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-[#7c3aed]">Educatopía</span>
            <span className="text-xs text-[#9ca3af] font-semibold hidden sm:inline">— Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#374151] hidden sm:inline">{profile.nombre}</span>
            <AdminNavClient />
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-[#6b7280] hover:text-[#7c3aed] whitespace-nowrap border-b-2 border-transparent hover:border-[#7c3aed] transition-colors"
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
