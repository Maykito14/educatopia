import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div
        className="bg-white rounded-[20px] px-10 pt-8 pb-10 text-center max-w-sm w-full border-t-[6px] border-[#7c3aed]"
        style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.1)" }}
      >
        <Image
          src="/logo.jpeg"
          alt="Educatopía"
          width={180}
          height={135}
          className="mx-auto mb-2 object-contain"
          priority
        />
        <p className="text-sm font-bold text-[#6b7280] mb-8">Sistema de Turnos</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/turnos/nuevo"
            className="block w-full bg-[#7c3aed] text-white rounded-xl py-4 font-black text-lg hover:bg-[#6d28d9] transition-colors"
          >
            Solicitar turno
          </Link>
        </div>
        <p className="mt-8 text-xs text-[#9ca3af]">
          ¿Sos profesor o administrador?{" "}
          <Link href="/login" className="text-[#7c3aed] font-bold hover:underline">
            Ingresá acá
          </Link>
        </p>
      </div>
    </main>
  );
}
