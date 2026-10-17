'use client'

import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { CopyReserva } from './copy'
import {
  MAX_CUANDO,
  MAX_NOMBRE,
  MAX_PEDIDO,
  OPCIONES_PERSONAS,
  construirMensajeReserva,
  primerCampoInvalido,
  resolverEnvioReserva,
  validarReserva,
  type CampoReserva,
  type ValoresReserva,
} from './reservaLogica'
import styles from './FormReserva.module.css'

type Envio = { url: string | null; bloqueado: boolean }

const VACIO: ValoresReserva = { nombre: '', detalle: '', cuando: '' }

// Único componente cliente de RESTAURANTE (aparte de `SeccionesSPA`): arma un
// mensaje de WhatsApp con lo que la persona escribió y lo abre. No guarda nada.
// Reserva de mesa, o encargo si el rubro es panadería (`copy.esEncargo`, P3).
export default function FormReserva({ telefono, copy, tituloId }: { telefono: string; copy: CopyReserva; tituloId?: string }) {
  const base = useId()
  const [valores, setValores] = useState<ValoresReserva>(VACIO)
  // La validación se activa después del primer intento de envío, no antes.
  const [intentado, setIntentado] = useState(false)
  const [envio, setEnvio] = useState<Envio | null>(null)
  const refs = useRef<Partial<Record<CampoReserva, HTMLInputElement | HTMLSelectElement | null>>>({})

  const errores = intentado ? validarReserva(valores, copy.esEncargo) : {}
  const id = (campo: string) => `${base}-${campo}`
  const idError = (campo: CampoReserva) => `${id(campo)}-error`
  const idApoyo = `${base}-apoyo`

  function cambiar(campo: CampoReserva) {
    return (evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor = evento.target.value
      setValores((anterior) => ({ ...anterior, [campo]: valor }))
      // Editar cualquier campo esconde la caja de "enviado".
      setEnvio(null)
    }
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setIntentado(true)
    const primero = primerCampoInvalido(validarReserva(valores, copy.esEncargo))
    if (primero) {
      setEnvio(null)
      refs.current[primero]?.focus()
      return
    }
    const mensaje = construirMensajeReserva(valores, copy.esEncargo)
    setEnvio(resolverEnvioReserva(telefono, mensaje, (url) => window.open(url, '_blank', 'noopener')))
  }

  function propsCampo(campo: CampoReserva, extra = '') {
    const error = errores[campo]
    return {
      id: id(campo),
      name: campo,
      'aria-invalid': error ? (true as const) : undefined,
      'aria-describedby': error ? idError(campo) : undefined,
      className: [styles.campo, extra, error ? styles.invalido : ''].filter(Boolean).join(' '),
    }
  }

  const mensajeError = (campo: CampoReserva) =>
    errores[campo] ? (
      <p id={idError(campo)} role="alert" className={styles.error}>
        {errores[campo]}
      </p>
    ) : null

  return (
    <form onSubmit={alEnviar} noValidate aria-labelledby={tituloId} className={styles.form}>
      <div className={styles.grupo}>
        <label htmlFor={id('nombre')} className={styles.rotulo}>
          Tu nombre
        </label>
        <input
          {...propsCampo('nombre')}
          ref={(nodo) => {
            refs.current.nombre = nodo
          }}
          type="text"
          autoComplete="name"
          maxLength={MAX_NOMBRE}
          value={valores.nombre}
          onChange={cambiar('nombre')}
        />
        {mensajeError('nombre')}
      </div>

      <div className={copy.esEncargo ? styles.grupoEncargo : styles.fila}>
        <div className={styles.grupo}>
          <label htmlFor={id('detalle')} className={styles.rotulo}>
            {copy.rotuloDetalle}
          </label>
          {copy.esEncargo ? (
            <input
              {...propsCampo('detalle')}
              ref={(nodo) => {
                refs.current.detalle = nodo
              }}
              type="text"
              maxLength={MAX_PEDIDO}
              placeholder={copy.placeholderDetalle ?? undefined}
              value={valores.detalle}
              onChange={cambiar('detalle')}
            />
          ) : (
            <select
              {...propsCampo('detalle', styles.select)}
              ref={(nodo) => {
                refs.current.detalle = nodo
              }}
              value={valores.detalle}
              onChange={cambiar('detalle')}
            >
              <option value="">Elige</option>
              {OPCIONES_PERSONAS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          )}
          {mensajeError('detalle')}
        </div>

        <div className={styles.grupo}>
          <label htmlFor={id('cuando')} className={styles.rotulo}>
            ¿Para cuándo?
          </label>
          <input
            {...propsCampo('cuando')}
            ref={(nodo) => {
              refs.current.cuando = nodo
            }}
            type="text"
            maxLength={MAX_CUANDO}
            placeholder="Por ejemplo: sábado a las 21:00"
            value={valores.cuando}
            onChange={cambiar('cuando')}
          />
          {mensajeError('cuando')}
        </div>
      </div>

      <button type="submit" className={styles.enviar} aria-describedby={idApoyo}>
        {copy.botonEnviar}
      </button>
      <p id={idApoyo} className={styles.apoyo}>
        {copy.apoyo}
      </p>

      <div role="status">
        {envio && (
          <div className={styles.estado}>
            <p className={styles.estadoTitulo}>Abrimos WhatsApp con tu mensaje</p>
            <p className={styles.estadoTexto}>{copy.estadoTexto.replace('{telefono}', telefono)}</p>
            {envio.bloqueado && envio.url && (
              <a href={envio.url} target="_blank" rel="noopener noreferrer" className={styles.abrir}>
                Abrir WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
