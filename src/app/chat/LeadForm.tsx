'use client'

import { useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  mensajeErrorCorreo,
  MENSAJES_LEAD,
  normalizarDigitosTelefono,
  telefonoLeadANormalizado,
  validarDatosLead,
  type ErroresLead,
} from '@/application/shared/datosLead'
import styles from './LeadForm.module.css'

interface LeadFormProps {
  nombre: string
  email: string
  // Solo los 8 dígitos; el prefijo "+56 9" es fijo y no se edita.
  telefono: string
  enviando: boolean
  // Error del envío (red o servidor); los datos escritos se conservan.
  error: string | null
  onNombreChange: (valor: string) => void
  onEmailChange: (valor: string) => void
  onTelefonoChange: (valor: string) => void
  onSubmit: () => void
}

type Campo = keyof ErroresLead

function errorDeCampo(campo: Campo, valor: string): string | undefined {
  switch (campo) {
    case 'nombre':
      return valor.trim() ? undefined : MENSAJES_LEAD.nombreVacio
    case 'email':
      return mensajeErrorCorreo(valor) ?? undefined
    case 'telefono':
      return telefonoLeadANormalizado(valor) ? undefined : MENSAJES_LEAD.telefono
  }
}

// Presentacional: los valores y el envío viven en ChatWidget. Lo único que
// guarda es qué errores mostrar: se validan al enviar y, tras el primer
// intento, al salir de cada campo.
export function LeadForm({
  nombre,
  email,
  telefono,
  enviando,
  error,
  onNombreChange,
  onEmailChange,
  onTelefonoChange,
  onSubmit,
}: LeadFormProps) {
  const id = useId()
  const ids = {
    titulo: `${id}-titulo`,
    nombre: `${id}-nombre`,
    email: `${id}-email`,
    telefono: `${id}-telefono`,
    errorNombre: `${id}-error-nombre`,
    errorEmail: `${id}-error-email`,
    errorTelefono: `${id}-error-telefono`,
    ayudaTelefono: `${id}-ayuda-telefono`,
  }
  const nombreRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const telefonoRef = useRef<HTMLInputElement>(null)
  const [intentado, setIntentado] = useState(false)
  const [errores, setErrores] = useState<ErroresLead>({})

  function alSalir(campo: Campo, valor: string) {
    if (!intentado) return
    setErrores((previos) => ({ ...previos, [campo]: errorDeCampo(campo, valor) }))
  }

  function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    setIntentado(true)
    const encontrados = validarDatosLead({ nombre, email, telefono })
    setErrores(encontrados)

    const primero = (['nombre', 'email', 'telefono'] as const).find((campo) => encontrados[campo])
    if (primero) {
      const destino = { nombre: nombreRef, email: emailRef, telefono: telefonoRef }[primero]
      destino.current?.focus()
      return
    }
    onSubmit()
  }

  const descritoPor = (campo: Campo, errorId: string, extra?: string) =>
    [errores[campo] ? errorId : null, extra].filter(Boolean).join(' ') || undefined

  return (
    <form className={styles.contenedor} onSubmit={manejarEnvio} noValidate aria-labelledby={ids.titulo}>
      <h2 className={styles.titulo} id={ids.titulo}>
        Tu sitio está listo para verlo
      </h2>
      <p className={styles.texto}>Déjanos tus datos y te lo mostramos ahora.</p>

      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={ids.nombre}>
          Tu nombre
        </label>
        <input
          ref={nombreRef}
          id={ids.nombre}
          className={`${styles.input} ${errores.nombre ? styles.invalido : ''}`}
          type="text"
          autoComplete="name"
          value={nombre}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onNombreChange(e.target.value)}
          onBlur={() => alSalir('nombre', nombre)}
          disabled={enviando}
          aria-invalid={errores.nombre ? true : undefined}
          aria-describedby={descritoPor('nombre', ids.errorNombre)}
        />
        {errores.nombre && (
          <p className={styles.mensajeError} id={ids.errorNombre}>
            {errores.nombre}
          </p>
        )}
      </div>

      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={ids.email}>
          Tu correo
        </label>
        <input
          ref={emailRef}
          id={ids.email}
          className={`${styles.input} ${errores.email ? styles.invalido : ''}`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
          onBlur={() => alSalir('email', email)}
          disabled={enviando}
          aria-invalid={errores.email ? true : undefined}
          aria-describedby={descritoPor('email', ids.errorEmail)}
        />
        {errores.email && (
          <p className={styles.mensajeError} id={ids.errorEmail}>
            {errores.email}
          </p>
        )}
      </div>

      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={ids.telefono}>
          WhatsApp del negocio
        </label>
        <div className={`${styles.telefono} ${errores.telefono ? styles.invalido : ''}`}>
          <span className={styles.prefijo} aria-hidden="true">
            +56 9
          </span>
          <input
            ref={telefonoRef}
            id={ids.telefono}
            className={styles.inputTelefono}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={telefono}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onTelefonoChange(normalizarDigitosTelefono(e.target.value))
            }
            onBlur={() => alSalir('telefono', telefono)}
            disabled={enviando}
            aria-label="WhatsApp del negocio, 8 dígitos después del +56 9"
            aria-invalid={errores.telefono ? true : undefined}
            aria-describedby={descritoPor('telefono', ids.errorTelefono, ids.ayudaTelefono)}
          />
        </div>
        {errores.telefono && (
          <p className={styles.mensajeError} id={ids.errorTelefono}>
            {errores.telefono}
          </p>
        )}
        <p className={styles.ayuda} id={ids.ayudaTelefono}>
          Es el número que recibe los mensajes de tu sitio. Puedes cambiarlo después.
        </p>
      </div>

      {error && (
        <p className={styles.errorEnvio} role="alert">
          {error}
        </p>
      )}

      <button className={styles.boton} type="submit" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Ver mi sitio'}
      </button>

      <p className={styles.pie}>
        Usamos estos datos solo para tu sitio.{' '}
        <a className={styles.enlace} href="/privacidad" target="_blank" rel="noopener noreferrer">
          Política de privacidad
        </a>
      </p>
    </form>
  )
}
