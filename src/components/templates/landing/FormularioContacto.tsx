'use client'

import type { FormEvent } from 'react'
import { construirWhatsAppFormulario } from './sections'
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
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const nombre = String(datos.get('nombre') ?? '')
    const email = String(datos.get('email') ?? '')
    const mensaje = String(datos.get('mensaje') ?? '')

    const url = construirWhatsAppFormulario(telefono, nombre, email, mensaje)
    if (!url) return

    window.open(url, '_blank', 'noopener,noreferrer')
    evento.currentTarget.reset()
  }

  return (
    <form onSubmit={alEnviar} className={styles.contactoForm}>
      <input type="text" name="nombre" placeholder="Tu nombre" required className={styles.contactoInput} />
      <input type="email" name="email" placeholder="Tu email" required className={styles.contactoInput} />
      <textarea name="mensaje" placeholder="Tu mensaje" rows={3} required className={styles.contactoTextarea} />
      <button type="submit" className={styles.contactoSubmit}>
        Enviar por WhatsApp
      </button>
    </form>
  )
}
