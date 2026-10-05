'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import styles from './completar.module.css'
import { AVANCE_TECHO_ANTES_DEL_PAGO } from '@/application/shared/avanceSitio'
import type { ValoresIniciales, VistaMomento2 } from '@/application/shared/momento2'
import { CamposTarea } from './CamposTarea'
import { EstadoMomento2, type MotivoEstado } from './EstadosMomento2'
import { Resumen } from './Resumen'
import { VistaSitio } from './VistaSitio'
import { guardarTareaAction, omitirTareaAction } from './actions'
import { cargaDeTarea, estadoDeGuardado, formularioInicial, type ValoresFormulario } from './formulario'
import type { ResultadoGuardado } from './resultado'
import {
  ANCLA_TAREA,
  HREF_VOLVER_AL_SITIO,
  MENSAJE_ERROR_GUARDADO,
  MENSAJE_HORARIO_INCOMPLETO,
  TITULO_HEADER,
  TITULO_TAREA,
  ayudaDeTarea,
  avisoGuardado,
  lineaFaltante,
  pantallaInicial,
} from './textos'

type GuardadoOk = Extract<ResultadoGuardado, { ok: true }>

type Pantalla =
  | { tipo: 'tarea'; indice: number }
  | { tipo: 'guardado'; indice: number; subio: boolean }
  | { tipo: 'resumen' }

const MEDIA_ESCRITORIO = '(min-width: 1024px)'
const DURACION_AVISO_MS = 4000

function useEsEscritorio(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia(MEDIA_ESCRITORIO)
      media.addEventListener('change', avisar)
      return () => media.removeEventListener('change', avisar)
    },
    () => window.matchMedia(MEDIA_ESCRITORIO).matches,
    () => false,
  )
}

interface Props {
  template: string | null
  // URL del sitio demo, sin ancla ni versión.
  urlSitio: string
  vistaInicial: VistaMomento2
  iniciales: ValoresIniciales
}

// Momento 2 (M1-M5, E2): una tarea por pantalla, guardado por tarea con la
// acción de servidor y recarga de la vista previa del sitio. En móvil, tras
// guardar se muestra "Así quedó"; en escritorio el sitio vive a la derecha, se
// recarga solo y la tarea avanza sin pantalla intermedia.
export function Momento2({ template, urlSitio, vistaInicial, iniciales }: Props) {
  const escritorio = useEsEscritorio()
  const [vista, setVista] = useState(vistaInicial)
  const [pantalla, setPantalla] = useState<Pantalla>(() => pantallaInicial(vistaInicial.tareas))
  const [valores, setValores] = useState<ValoresFormulario>(() => formularioInicial(iniciales))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bloqueado, setBloqueado] = useState<MotivoEstado | null>(null)
  const [version, setVersion] = useState(0)
  const [ancla, setAncla] = useState('')
  const [subioEncabezado, setSubioEncabezado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  // Se abrió una tarea desde el resumen: al terminar se vuelve a él.
  const [vieneDelResumen, setVieneDelResumen] = useState(false)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primeraPantalla = useRef(true)

  const nombresServicios = iniciales.servicios.map((servicio) => servicio.nombre)
  const total = vista.tareas.length

  // Cada pantalla nueva lleva el foco a su título (a11y); la primera no, para
  // no mover la página al cargar.
  useEffect(() => {
    if (primeraPantalla.current) {
      primeraPantalla.current = false
      return
    }
    tituloRef.current?.focus()
  }, [pantalla])

  useEffect(() => {
    if (aviso === null) return
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS)
    return () => clearTimeout(temporizador)
  }, [aviso])

  if (bloqueado) return <EstadoMomento2 motivo={bloqueado} />

  async function ejecutar(accion: () => Promise<ResultadoGuardado>): Promise<GuardadoOk | null> {
    setEnviando(true)
    setError(null)
    setSubioEncabezado(false)
    try {
      const resultado = await accion()
      if (resultado.ok) return resultado
      if (resultado.error === 'cerrado' || resultado.error === 'sesion_vencida') setBloqueado(resultado.error)
      else setError(MENSAJE_ERROR_GUARDADO)
      return null
    } catch {
      setError(MENSAJE_ERROR_GUARDADO)
      return null
    } finally {
      setEnviando(false)
    }
  }

  // Después de terminar una tarea: el resumen si venía de él o era la última,
  // y si no, la siguiente.
  function avanzarDesde(indice: number) {
    setPantalla(vieneDelResumen || indice + 1 >= total ? { tipo: 'resumen' } : { tipo: 'tarea', indice: indice + 1 })
    if (vieneDelResumen || indice + 1 >= total) setVieneDelResumen(false)
  }

  async function guardar(indice: number) {
    const id = vista.tareas[indice].id
    const resultado = await ejecutar(() => guardarTareaAction(id, cargaDeTarea(id, valores)))
    if (!resultado) return

    const subio = resultado.vista.avance > vista.avance
    setVista(resultado.vista)
    setVersion((v) => v + 1)
    setAncla(ANCLA_TAREA[id])
    setSubioEncabezado(subio)

    if (escritorio) {
      setAviso(avisoGuardado(resultado.vista.avance, subio))
      avanzarDesde(indice)
    } else {
      setPantalla({ tipo: 'guardado', indice, subio })
    }
  }

  async function omitir(indice: number) {
    const resultado = await ejecutar(() => omitirTareaAction(vista.tareas[indice].id))
    if (!resultado) return
    setVista(resultado.vista)
    avanzarDesde(indice)
  }

  function abrirTarea(indice: number, desdeResumen: boolean) {
    setError(null)
    setVieneDelResumen(desdeResumen)
    setPantalla({ tipo: 'tarea', indice })
  }

  const urlVista = `${urlSitio}?v=${version}${ancla ? `#${ancla}` : ''}`
  const tarea = pantalla.tipo === 'resumen' ? null : vista.tareas[pantalla.indice]
  const guardable = tarea ? estadoDeGuardado(tarea.id, valores, template) : null
  const horarioIncompleto = guardable !== null && !guardable.puede && guardable.error === 'horario_incompleto'

  return (
    <div className={styles.pagina}>
      <header className={styles.header}>
        <Link href={HREF_VOLVER_AL_SITIO} className={styles.cerrar} aria-label="Cerrar y volver a mi sitio">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link href={HREF_VOLVER_AL_SITIO} className={styles.volverEscritorio}>
          <span aria-hidden="true">←</span> Volver a mi sitio
        </Link>
        <p className={styles.tituloHeader}>{TITULO_HEADER}</p>
        <div className={styles.derecha}>
          <span className={`${styles.porcentaje} ${subioEncabezado ? styles.porcentajeSubio : ''}`}>
            {vista.avance} %
          </span>
          <span className={styles.barraHeader} aria-hidden="true">
            <span className={styles.barraHeaderRelleno} style={{ width: `${Math.min(vista.avance, AVANCE_TECHO_ANTES_DEL_PAGO)}%` }} />
          </span>
        </div>
      </header>

      <div className={styles.cuerpo}>
        <main className={styles.panel}>
          <div className={styles.contenido}>
            {pantalla.tipo === 'resumen' && (
              <Resumen
                vista={vista}
                template={template}
                titleRef={tituloRef}
                onEditar={(indice) => abrirTarea(indice, true)}
              />
            )}

            {pantalla.tipo === 'tarea' && tarea && (
              <>
                <p className={styles.rotulo}>
                  Paso {pantalla.indice + 1} de {total}
                </p>
                <h1 ref={tituloRef} tabIndex={-1} className={styles.titulo}>
                  {TITULO_TAREA[tarea.id]}
                </h1>
                <p className={styles.ayuda}>{ayudaDeTarea(tarea.id, template)}</p>
                <CamposTarea
                  id={tarea.id}
                  template={template}
                  nombresServicios={nombresServicios}
                  valores={valores}
                  onCambio={setValores}
                />
                {tarea.id === 'horarios' && horarioIncompleto && <p className={styles.nota}>{MENSAJE_HORARIO_INCOMPLETO}</p>}
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
              </>
            )}

            {pantalla.tipo === 'guardado' && tarea && (
              <>
                <p className={styles.guardado} role="status">
                  <svg className={styles.check} viewBox="0 0 26 26" fill="none" aria-hidden="true">
                    <circle cx="13" cy="13" r="13" fill="currentColor" />
                    <path d="M7.5 13.5l3.7 3.7 7.3-7.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {avisoGuardado(vista.avance, pantalla.subio)}
                </p>
                <h1 ref={tituloRef} tabIndex={-1} className={styles.titulo}>
                  Así quedó en tu sitio
                </h1>
                <VistaSitio key={version} url={urlVista} escritorio={false} />
                {lineaFaltante(tarea.id, vista) && <p className={styles.faltante}>{lineaFaltante(tarea.id, vista)}</p>}
              </>
            )}
          </div>

          <div className={styles.barra}>
            {pantalla.tipo === 'tarea' && tarea && (
              <>
                <button
                  type="button"
                  className={styles.botonPrimario}
                  disabled={enviando || !guardable?.puede}
                  onClick={() => guardar(pantalla.indice)}
                >
                  Guardar y ver cómo queda
                </button>
                <button type="button" className={styles.enlaceAccion} disabled={enviando} onClick={() => omitir(pantalla.indice)}>
                  Omitir este paso
                </button>
              </>
            )}

            {pantalla.tipo === 'guardado' && (
              <>
                <button
                  type="button"
                  className={styles.botonPrimario}
                  onClick={() => avanzarDesde(pantalla.indice)}
                >
                  {vieneDelResumen || pantalla.indice + 1 >= total
                    ? 'Ver el resumen'
                    : `Siguiente: ${TITULO_TAREA[vista.tareas[pantalla.indice + 1].id]}`}
                </button>
                <button type="button" className={styles.enlaceAccion} onClick={() => abrirTarea(pantalla.indice, vieneDelResumen)}>
                  Cambiar algo
                </button>
              </>
            )}

            {pantalla.tipo === 'resumen' &&
              (vista.avance >= AVANCE_TECHO_ANTES_DEL_PAGO ? (
                <Link href={HREF_VOLVER_AL_SITIO} className={styles.botonPrimario}>
                  Ver mi sitio y continuar
                </Link>
              ) : (
                <Link href={HREF_VOLVER_AL_SITIO} className={styles.botonTinta}>
                  Volver a mi sitio
                </Link>
              ))}
          </div>
        </main>

        {escritorio && (
          <aside className={styles.columnaSitio} aria-label="Tu sitio">
            <p className={styles.rotulo}>Tu sitio</p>
            <p className={styles.ayuda}>Se actualiza al guardar</p>
            <p className={styles.avisoGuardado} role="status">
              {aviso}
            </p>
            <VistaSitio key={version} url={urlVista} escritorio />
          </aside>
        )}
      </div>
    </div>
  )
}
