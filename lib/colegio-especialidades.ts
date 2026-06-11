export const COLEGIO_ESPECIALIDADES: Record<string, string[]> = {
  "IPETAYM 68": ["Química", "Electromecánica", "Agropecuaria", "Humanidades"],
  "DR. DALMACIO VELEZ SÁRSFIELD": ["Economía", "Cs. Naturales"],
  "IPEM 329": ["Artes Visuales", "Música", "Educación Fisica"],
  "INSTITUTO HERMANAS MERCEDARIAS": ["Humanidades", "Informática"],
  "PROA": ["Programación"],
};

export function getEspecialidades(colegio: string): string[] {
  return COLEGIO_ESPECIALIDADES[colegio] ?? [];
}
