'use client'

import type { ChangeEvent, FormEvent } from 'react'
import styles from './LeadForm.module.css'

interface LeadFormProps {
  nombre: string
  email: string
  enviando: boolean
  error: string | null
  onNombreChange: (valor: string) => void
  onEmailChange: (valor: string) => void
  onSubmit: () => void
}

// Componente presentacional puro: no maneja su propio estado ni hace
// fetch — todo eso vive en ChatWidget (contenedor). Solo pide nombre y
// correo; el nombre de la empresa ya se preguntó como pregunta 1 del chat.
export function LeadForm({
  nombre,
  email,
  enviando,
  error,
  onNombreChange,
  onEmailChange,
  onSubmit,
}: LeadFormProps) {
  const deshabilitado = enviando || !nombre.trim() || !email.trim()

  function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.contenedor} onSubmit={manejarEnvio}>
      <p className={styles.titulo}>Para mostrarte tu sitio de ejemplo, necesitamos tu nombre y tu correo.</p>

      <label className={styles.campo}>
        <span className={styles.etiqueta}>Nombre</span>
        <input
          className={styles.input}
          type="text"
          value={nombre}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onNombreChange(e.target.value)}
          placeholder="Tu nombre"
          disabled={enviando}
          required
        />
      </label>

      <label className={styles.campo}>
        <span className={styles.etiqueta}>Correo electrónico</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          disabled={enviando}
          required
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.boton} type="submit" disabled={deshabilitado}>
        {enviando ? 'Enviando...' : 'Ver mi sitio de ejemplo'}
      </button>
    </form>
  )
}
