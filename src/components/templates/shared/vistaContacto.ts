import { buildTelUrl, buildMailtoUrl } from './enlaces'
import { comoHorarios, type Horario } from './contenido'

export type TarjetaContacto = { clave: 'telefono' | 'correo' | 'direccion'; etiqueta: string; valor: string; href: string | null }

export type DatosContactoVista = { horarios: Horario[]; tarjetas: TarjetaContacto[] }

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
}

// Columna derecha de Contacto (C1, sin mapa): horarios solo si hay filas
// utilizables, y una tarjeta por dato que exista (teléfono, correo, dirección; esta última sin enlace ni mapa). Nada se
// inventa; un correo con caracteres inseguros para mailto: se muestra sin
// enlace (`href` null). Sin datos la lista queda vacía y el componente no pinta la columna.
export function datosContactoVista(entrada: { horarios?: unknown; telefono?: unknown; email?: unknown; direccion?: unknown }): DatosContactoVista {
  const telefono = texto(entrada.telefono)
  const email = texto(entrada.email)
  const direccion = texto(entrada.direccion)
  const tarjetas: TarjetaContacto[] = []
  if (telefono) tarjetas.push({ clave: 'telefono', etiqueta: 'Teléfono', valor: telefono, href: buildTelUrl(telefono) })
  if (email) tarjetas.push({ clave: 'correo', etiqueta: 'Correo', valor: email, href: buildMailtoUrl(email) })
  if (direccion) tarjetas.push({ clave: 'direccion', etiqueta: 'Dirección', valor: direccion, href: null })
  return { horarios: comoHorarios(entrada.horarios), tarjetas }
}
