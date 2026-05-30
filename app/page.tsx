import Image from "next/image";
import Link from "next/link";

// ── Datos de la academia ────────────────────────────────────────
const SERVICIOS = [
  { icon: "📚", titulo: "Apoyo Primario",     desc: "Acompañamiento personalizado en todas las materias del nivel primario." },
  { icon: "🎓", titulo: "Apoyo Secundario",   desc: "Refuerzo y preparación para exámenes en todas las asignaturas." },
  { icon: "🏛️", titulo: "Nivel Terciario",    desc: "Acompañamiento para estudiantes de carreras universitarias y terciarias." },
  { icon: "💻", titulo: "Informática y TIC",  desc: "Cursos de computación, programación y tecnología para todas las edades." },
  { icon: "🌍", titulo: "Inglés",             desc: "Clases de inglés para niños y adolescentes con metodología activa." },
  { icon: "🎨", titulo: "Talleres",           desc: "Talleres educativos y charlas temáticas para el desarrollo integral." },
];

const VALORES = [
  { icon: "🤝", titulo: "Aprendizaje en equipo",   desc: "Creemos que aprender es un proceso que se construye junto a otros." },
  { icon: "🌱", titulo: "Sin presión",              desc: "Acompañamos a cada alumno a su ritmo, sin estrés ni comparaciones." },
  { icon: "👁️", titulo: "Atención personalizada",  desc: "Grupos reducidos para que cada estudiante reciba la atención que merece." },
  { icon: "📅", titulo: "Inscripción todo el año",  desc: "Podés sumarte en cualquier momento, no esperes a fin de año." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#ede9fe]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="Educatopía" width={38} height={28} className="object-contain rounded-md" />
            <span className="font-black text-[#1e1b4b] text-lg leading-none">Educatopía</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-bold text-[#7c3aed] hover:underline"
            >
              Ingresar como staff
            </Link>
            <Link
              href="/turnos/nuevo"
              className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-sm font-black hover:bg-[#6d28d9] transition-colors"
            >
              Solicitar turno
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f5f3ff] via-white to-[#ecfdf5] pt-16 pb-24 px-5">
        {/* Decoraciones de fondo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#7c3aed]/8 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#10b981]/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f59e0b]/5 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
          <Image
            src="/logo.jpeg"
            alt="Educatopía"
            width={160}
            height={120}
            className="object-contain drop-shadow-md"
            priority
          />

          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#ede9fe] text-[#7c3aed] text-xs font-extrabold uppercase tracking-widest mb-5">
              Centro de apoyo escolar · Arroyito, Córdoba
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#1e1b4b] leading-tight mb-5">
              Aprender es mejor<br />
              <span className="text-[#7c3aed]">cuando tenés quien te acompañe</span>
            </h1>
            <p className="text-lg text-[#6b7280] font-semibold max-w-xl mx-auto leading-relaxed">
              Clases de apoyo escolar personalizadas para primario, secundario y terciario.
              También informática, inglés y talleres. Inscripción abierta todo el año.
            </p>
          </div>

          {/* CTAs principales */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:justify-center">
            <Link
              href="/turnos/nuevo"
              className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#7c3aed] text-white font-black text-lg hover:bg-[#6d28d9] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#7c3aed]/30"
            >
              <span className="text-2xl">📅</span>
              Solicitar turno
            </Link>
            <a
              href="https://wa.me/5493576481630?text=Hola!%20Quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Educatop%C3%ADa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#25d366] text-white font-black text-lg hover:bg-[#1da851] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#25d366]/30"
            >
              <span className="text-2xl">💬</span>
              Consultanos por WhatsApp
            </a>
          </div>

          {/* Dirección */}
          <p className="text-sm text-[#9ca3af] font-semibold flex items-center gap-1.5">
            <span>📍</span> Dalle Mura 1445, Arroyito · <span className="text-[#7c3aed]">3576-481630</span>
          </p>
        </div>
      </section>

      {/* ── SERVICIOS ───────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fef3c7] text-[#d97706] text-xs font-extrabold uppercase tracking-widest mb-4">
              Lo que ofrecemos
            </span>
            <h2 className="text-3xl font-black text-[#1e1b4b]">Nuestros servicios</h2>
            <p className="text-[#6b7280] font-semibold mt-2">Todo lo que necesitás para potenciar tu aprendizaje</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICIOS.map((s) => (
              <div
                key={s.titulo}
                className="group rounded-2xl border-2 border-[#f3f4f6] p-6 hover:border-[#7c3aed] hover:shadow-lg hover:shadow-[#7c3aed]/10 transition-all hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f5f3ff] flex items-center justify-center text-2xl mb-4 group-hover:bg-[#ede9fe] transition-colors">
                  {s.icon}
                </div>
                <h3 className="font-black text-[#1e1b4b] text-base mb-2">{s.titulo}</h3>
                <p className="text-sm text-[#6b7280] font-semibold leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALORES / FILOSOFÍA ─────────────────────────────────── */}
      <section className="py-20 px-5 bg-gradient-to-br from-[#f5f3ff] to-[#ecfdf5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#d1fae5] text-[#059669] text-xs font-extrabold uppercase tracking-widest mb-4">
              Nuestra filosofía
            </span>
            <h2 className="text-3xl font-black text-[#1e1b4b]">¿Por qué elegirnos?</h2>
            <p className="text-[#6b7280] font-semibold mt-2 max-w-lg mx-auto">
              "Aprender es un proceso que se construye en equipo"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALORES.map((v) => (
              <div key={v.titulo} className="flex gap-4 bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#f5f3ff] flex items-center justify-center text-2xl flex-shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-black text-[#1e1b4b] mb-1">{v.titulo}</h3>
                  <p className="text-sm text-[#6b7280] font-semibold leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA CENTRAL ─────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-[#7c3aed]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-5">🚀</div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            ¿Listo para empezar?
          </h2>
          <p className="text-[#c4b5fd] font-semibold mb-8 text-lg leading-relaxed">
            Elegí el horario que más te convenga y agendá tu primer clase de apoyo.
            Atención personalizada, grupos reducidos y acompañamiento real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/turnos/nuevo"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#7c3aed] font-black text-lg hover:bg-[#f5f3ff] transition-all hover:-translate-y-0.5 shadow-xl"
            >
              📅 Solicitar turno ahora
            </Link>
            <a
              href="https://wa.me/5493576481630?text=Hola!%20Quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Educatop%C3%ADa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#25d366] text-white font-black text-lg hover:bg-[#1da851] transition-all hover:-translate-y-0.5"
            >
              💬 Escribinos
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACTO / UBICACIÓN ────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fee2e2] text-[#ef4444] text-xs font-extrabold uppercase tracking-widest mb-4">
              Encontranos
            </span>
            <h2 className="text-3xl font-black text-[#1e1b4b]">Dónde estamos</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "📍", titulo: "Dirección",  valor: "Dalle Mura 1445\nArroyito, Córdoba" },
              { icon: "📱", titulo: "WhatsApp",   valor: "3576-481630" },
              { icon: "📸", titulo: "Instagram",  valor: "@educatopia.arroyito" },
            ].map((item) => (
              <div key={item.titulo} className="text-center rounded-2xl bg-[#f9fafb] p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-xs font-extrabold text-[#9ca3af] uppercase tracking-widest mb-1">{item.titulo}</p>
                <p className="font-black text-[#1e1b4b] whitespace-pre-line leading-snug">{item.valor}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://wa.me/5493576481630?text=Hola!%20Quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Educatop%C3%ADa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#25d366] text-white font-black text-lg hover:bg-[#1da851] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#25d366]/30"
            >
              💬 Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-[#1e1b4b] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Educatopía" width={36} height={27} className="object-contain rounded-md opacity-90" />
            <div>
              <p className="font-black text-white text-sm">Educatopía</p>
              <p className="text-[#c4b5fd] text-xs font-semibold">Centro de apoyo escolar · Arroyito</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/turnos/nuevo" className="text-[#c4b5fd] font-bold hover:text-white transition-colors">
              Solicitar turno
            </Link>
            <a
              href="https://www.instagram.com/educatopia.arroyito"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c4b5fd] font-bold hover:text-white transition-colors"
            >
              Instagram
            </a>
            <Link href="/login" className="text-[#c4b5fd] font-bold hover:text-white transition-colors">
              Staff
            </Link>
          </div>

          <p className="text-[#6b7280] text-xs font-semibold text-center sm:text-right">
            © {new Date().getFullYear()} Educatopía · Dalle Mura 1445, Arroyito
          </p>
        </div>
      </footer>

    </div>
  );
}
