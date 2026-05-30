"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Normaliza el nombre de usuario a email interno: "Señoandrea" → "senoandrea@educatopia.ar" */
function toEmail(username: string): string {
  const normalized = username
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes y diacríticos
    .replace(/[^a-z0-9]/g, "");       // solo alfanumérico
  return `${normalized}@educatopia.ar`;
}

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password) return;
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: toEmail(usuario),
      password,
    });

    if (authError) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Leer rol: primero desde metadatos del token (sin consulta DB), luego fallback a profiles
    const { data: { user } } = await supabase.auth.getUser();
    const rolFromMeta = user?.user_metadata?.rol as string | undefined;

    let rol = rolFromMeta;
    if (!rol) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user?.id ?? "")
        .single<{ rol: string }>();
      rol = profile?.rol;
    }

    if (rol === "admin") {
      router.push("/admin");
    } else if (rol === "profesor") {
      router.push("/profesor");
    } else {
      router.push("/");
    }
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border-2 border-[#e5e7eb] text-[#1e1b4b] font-semibold text-base outline-none focus:border-[#7c3aed] transition-colors bg-white";

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white rounded-[20px] p-8 w-full max-w-sm border-t-[6px] border-[#7c3aed]"
      style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.1)" }}
    >
      <Image
        src="/logo.jpeg"
        alt="Educatopía"
        width={130}
        height={98}
        className="mx-auto mb-5 object-contain"
        priority
      />

      <h1 className="text-xl font-black text-[#1e1b4b] mb-1 text-center">
        Ingreso de staff
      </h1>
      <p className="text-xs text-[#9ca3af] font-semibold text-center mb-7">
        Solo para profesores y administradores
      </p>

      {error && (
        <div className="bg-[#fee2e2] text-[#ef4444] text-sm font-bold rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-extrabold text-[#374151] mb-1.5 uppercase tracking-wide">
            Usuario
          </label>
          <input
            type="text"
            autoComplete="username"
            autoFocus
            placeholder="Ej: profemarlen"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-[#374151] mb-1.5 uppercase tracking-wide">
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !usuario.trim() || !password}
        className="w-full py-4 rounded-xl bg-[#7c3aed] text-white font-black text-lg hover:bg-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>

      <div className="mt-6 text-center">
        <Link
          href="/turnos/nuevo"
          className="text-xs text-[#9ca3af] font-semibold hover:text-[#7c3aed] transition-colors"
        >
          ← Volver al formulario de turnos
        </Link>
      </div>
    </form>
  );
}
