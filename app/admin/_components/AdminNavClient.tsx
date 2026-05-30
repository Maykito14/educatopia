"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminNavClient() {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
  }
  return (
    <button onClick={logout} className="text-xs font-bold text-[#9ca3af] hover:text-[#ef4444] transition-colors px-2 py-1">
      Salir
    </button>
  );
}
