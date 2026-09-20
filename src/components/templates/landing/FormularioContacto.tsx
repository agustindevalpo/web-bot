'use client'

import { useState, type FormEvent } from 'react'
import { resolverEnvioContacto } from './sections'
import styles from './Landing.module.css'

// Único 'use client' propio de LANDING, aparte de `SeccionesSPA` (que no
// toca esta plantilla en particular). No convierte la plantilla entera a
// cliente (README.md, "Implicancia arquitectónica"): es una isla mínima
// alrededor del único elemento que de verdad necesita el navegador — armar
// el mensaje de WhatsApp con lo que la persona tipeó recién y abrirlo, cosa
// que ningún Server Component puede hacer (Regla transversal,
// PLAN-SLICES.md:94-95: los formularios arman `wa.me`, no `mailto:`, y acá
// no hay backend que reciba un POST).
export default function FormularioContacto({ telefono }: { telefono: string }) {
  // Feedback de los dos caminos silenciosos que arreglamos en R3-002: sin
  // teléfono utilizable, o con el popup de WhatsApp bloqueado. La decisión
  // vive en `resolverEnvioContacto` (sections.ts, pura y pineada en tests);
  // acá solo se aplica el resultado.
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null)

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    const nombre = String(datos.get('nombre') ?? '')
    const email = String(datos.get('email') ?? '')
    const mensaje = String(datos.get('mensaje') ?? '')

    const resultado = resolverEnvioContacto(telefono, nombre, email, mensaje, (url) =>
      window.open(url, '_blank', 'noopener,noreferrer'),
    )
    setMensajeEstado(resultado.mensaje)
    // Solo se limpia lo tipeado cuando algo realmente se abrió — nunca con
    // teléfono inutilizable ni con el popup bloqueado.
    if (resultado.debeResetear) formulario.reset()
  }

  return (
    <form onSubmit={alEnviar} className={styles.contactoForm}>
      <input type="text" name="nombre" placeholder="Tu nombre" required className={styles.contactoInput} />
      <input type="email" name="email" placeholder="Tu email" required className={styles.contactoInput} />
      <textarea name="mensaje" placeholder="Tu mensaje" rows={3} required className={styles.contactoTextarea} />
      <button type="submit" className={styles.contactoSubmit}>
        Enviar por WhatsApp
      </button>
      {mensajeEstado && (
        <p role="status" className={styles.contactoEstado}>
          {mensajeEstado}
        </p>
      )}
    </form>
  )
}
