'use client'

import { useState, type FormEvent } from 'react'
import { construirMensajeContacto, construirMensajeAgenda, resolverEnvioContacto } from './contactoEnvio'
import styles from './Contacto.module.css'

// Isla cliente mínima de Contacto (aparte de `SeccionesSPA`): arma el mensaje
// de WhatsApp con lo que la persona tipeó y lo abre, cosa que ningún Server
// Component puede hacer (no hay backend que reciba un POST).
//
// Sin `servicios` (LANDING): nombre, email, mensaje. Con `servicios`
// (SERVICIOS): nombre, `<select>` de servicios y "¿Qué día te acomoda?".
export default function FormularioContacto({ telefono, servicios }: { telefono: string; servicios?: string[] }) {
  // Feedback de los caminos silenciosos de R3-002; la decisión vive en
  // `resolverEnvioContacto` (pura y pineada en tests).
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null)

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    const campo = (nombre: string) => String(datos.get(nombre) ?? '')

    const texto = servicios
      ? construirMensajeAgenda(campo('nombre'), campo('servicio'), campo('dia'))
      : construirMensajeContacto(campo('nombre'), campo('email'), campo('mensaje'))

    const resultado = resolverEnvioContacto(telefono, texto, (url) => window.open(url, '_blank', 'noopener,noreferrer'))
    setMensajeEstado(resultado.mensaje)
    // Solo se limpia lo tipeado cuando algo realmente se abrió.
    if (resultado.debeResetear) formulario.reset()
  }

  return (
    <form onSubmit={alEnviar} className={styles.form}>
      <input type="text" name="nombre" placeholder="Tu nombre" required className={styles.campo} />
      {servicios ? (
        <>
          <select name="servicio" defaultValue="" className={`${styles.campo} ${styles.select}`} aria-label="Servicio">
            <option value="">¿Qué servicio necesitas?</option>
            {servicios.map((servicio) => (
              <option key={servicio} value={servicio}>
                {servicio}
              </option>
            ))}
          </select>
          <input type="text" name="dia" placeholder="¿Qué día te acomoda?" className={styles.campo} />
        </>
      ) : (
        <>
          <input type="email" name="email" placeholder="Tu email" required className={styles.campo} />
          <textarea name="mensaje" placeholder="Tu mensaje" rows={4} required className={`${styles.campo} ${styles.areaTexto}`} />
        </>
      )}
      <button type="submit" className={styles.enviar}>
        Enviar por WhatsApp
      </button>
      {mensajeEstado && (
        <p role="status" className={styles.estado}>
          {mensajeEstado}
        </p>
      )}
    </form>
  )
}
