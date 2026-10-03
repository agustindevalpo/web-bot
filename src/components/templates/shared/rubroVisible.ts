// Nombre del rubro tal como se le muestra a un visitante (píldora del hero
// Bloques, README.md:148: "{rubro} · {ciudad}", en mayúscula inicial). Las
// claves internas ("panaderia") no llevan tildes ni espacios, así que los
// rubros conocidos tienen su forma escrita; cualquier otro valor libre solo
// sube la primera letra.
const RUBROS: Record<string, string> = {
  panaderia: 'Panadería',
  peluqueria: 'Peluquería',
  dentista: 'Dentista',
  restaurante: 'Restaurante',
  consultora: 'Consultora',
  taller: 'Taller mecánico',
  yoga: 'Yoga',
  ferreteria: 'Ferretería',
  veterinaria: 'Veterinaria',
  tienda: 'Tienda',
}

export function rubroVisible(rubro: string): string {
  const limpio = rubro.trim()
  const conocido = RUBROS[limpio.toLowerCase()]
  if (conocido) return conocido
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}
