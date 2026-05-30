"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfesorNavClient() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-bold text-[#9ca3af] hover:text-[#ef4444] transition-colors px-2 py-1"
    >
      Salir
    </button>
  );
}
