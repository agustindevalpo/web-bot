'use client'

import { useId } from 'react'
import styles from './completar.module.css'
import type { IdTareaMomento2 } from '@/application/shared/avanceSitio'
import { LIMITES_MOMENTO2 } from '@/application/shared/momento2'
import {
  agregarHorario,
  agregarServicio,
  puedeAgregarHorario,
  puedeAgregarServicio,
  quitarServicioNuevo,
  type ValoresFormulario,
} from './formulario'

const DIAS_SUGERIDOS = ['Lunes a viernes', 'Sábado', 'Domingo'] as const
const UMBRAL_CONTADOR_FRASE = 120
const UMBRAL_CONTADOR_DISTINTO = 180

interface Props {
  id: IdTareaMomento2
  template: string | null
  // Nombres de los servicios del sitio, en el orden de `valores.servicios`.
  nombresServicios: readonly string[]
  valores: ValoresFormulario
  onCambio: (valores: ValoresFormulario) => void
}

// Los campos de cada tarea (M1, M4 y las dos sin pantalla dibujada). Controlado:
// el estado vive en `Momento2` para que sobreviva al paso por "Así quedó". Los
// campos dejan de aceptar texto en el máximo (`maxLength`), sin mensaje de error.
export function CamposTarea({ id, template, nombresServicios, valores, onCambio }: Props) {
  switch (id) {
    case 'servicios':
      return <CamposServicios template={template} nombres={nombresServicios} valores={valores} onCambio={onCambio} />
    case 'horarios':
      return <CamposHorarios valores={valores} onCambio={onCambio} />
    case 'nosotros':
      return <CamposNosotros valores={valores} onCambio={onCambio} />
    case 'frase':
      return <CamposFrase valores={valores} onCambio={onCambio} />
  }
}

function CamposServicios({
  template,
  nombres,
  valores,
  onCambio,
}: Pick<Props, 'template' | 'valores' | 'onCambio'> & { nombres: readonly string[] }) {
  const conPrecio = template === 'SERVICIOS'

  const cambiar = (indice: number, campo: 'descripcion' | 'precioDesde', valor: string) =>
    onCambio({
      ...valores,
      servicios: valores.servicios.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    })

  const cambiarNuevo = (indice: number, campo: 'nombre' | 'descripcion' | 'precioDesde', valor: string) =>
    onCambio({
      ...valores,
      serviciosNuevos: valores.serviciosNuevos.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    })

  return (
    <div>
      {valores.servicios.map((fila, indice) => {
        const nombre = nombres[indice] ?? ''
        return (
          <div key={indice} className={styles.grupo}>
            {nombre && <p className={styles.nombreServicio}>{nombre}</p>}
            <div className={`${styles.filaCampos} ${conPrecio ? '' : styles.filaCamposSolo}`}>
              <input
                type="text"
                className={styles.campo}
                value={fila.descripcion}
                maxLength={LIMITES_MOMENTO2.descripcion}
                placeholder="Qué incluye, en una línea"
                aria-label={`Qué incluye, en una línea: ${nombre}`}
                onChange={(e) => cambiar(indice, 'descripcion', e.target.value)}
              />
              {conPrecio && (
                <input
                  type="text"
                  className={`${styles.campo} ${styles.campoPrecio}`}
                  value={fila.precioDesde}
                  maxLength={LIMITES_MOMENTO2.precioDesde}
                  placeholder="Precio desde"
                  aria-label={`Precio desde: ${nombre}`}
                  onChange={(e) => cambiar(indice, 'precioDesde', e.target.value)}
                />
              )}
            </div>
          </div>
        )
      })}

      {valores.serviciosNuevos.map((fila, indice) => {
        const numero = valores.servicios.length + indice + 1
        return (
          <div key={`nuevo-${indice}`} className={styles.grupo}>
            <input
              type="text"
              className={`${styles.campo} ${styles.campoNombreNuevo}`}
              value={fila.nombre}
              maxLength={LIMITES_MOMENTO2.nombreServicio}
              placeholder="Nombre del servicio"
              aria-label={`Nombre del servicio ${numero}`}
              onChange={(e) => cambiarNuevo(indice, 'nombre', e.target.value)}
            />
            <div className={`${styles.filaCampos} ${conPrecio ? '' : styles.filaCamposSolo}`}>
              <input
                type="text"
                className={styles.campo}
                value={fila.descripcion}
                maxLength={LIMITES_MOMENTO2.descripcion}
                placeholder="Qué incluye, en una línea"
                aria-label={`Qué incluye, en una línea: servicio ${numero}`}
                onChange={(e) => cambiarNuevo(indice, 'descripcion', e.target.value)}
              />
              {conPrecio && (
                <input
                  type="text"
                  className={`${styles.campo} ${styles.campoPrecio}`}
                  value={fila.precioDesde}
                  maxLength={LIMITES_MOMENTO2.precioDesde}
                  placeholder="Precio desde"
                  aria-label={`Precio desde: servicio ${numero}`}
                  onChange={(e) => cambiarNuevo(indice, 'precioDesde', e.target.value)}
                />
              )}
            </div>
            <button
              type="button"
              className={`${styles.enlaceAccion} ${styles.enlaceInline}`}
              aria-label={`Quitar servicio ${numero}`}
              onClick={() => onCambio(quitarServicioNuevo(valores, indice))}
            >
              Quitar
            </button>
          </div>
        )
      })}

      {puedeAgregarServicio(valores) && (
        <button
          type="button"
          className={`${styles.enlaceAccion} ${styles.enlaceInline}`}
          onClick={() => onCambio(agregarServicio(valores))}
        >
          Agregar servicio
        </button>
      )}
    </div>
  )
}

function CamposHorarios({ valores, onCambio }: Pick<Props, 'valores' | 'onCambio'>) {
  const cambiar = (indice: number, campo: 'dia' | 'rango', valor: string) =>
    onCambio({
      ...valores,
      horarios: valores.horarios.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    })

  return (
    <div>
      <div role="group" aria-label="Días sugeridos" className={styles.sugerencias}>
        {DIAS_SUGERIDOS.map((dia) => (
          <button
            key={dia}
            type="button"
            className={styles.sugerencia}
            aria-label={`Usar ${dia} como días del primer horario`}
            onClick={() => cambiar(0, 'dia', dia)}
          >
            <span className={styles.mas} aria-hidden="true">
              +
            </span>
            {dia}
          </button>
        ))}
      </div>

      {valores.horarios.map((fila, indice) => (
        <div key={indice} className={styles.grupo}>
          <div className={styles.filaCampos}>
            <input
              type="text"
              className={styles.campo}
              value={fila.dia}
              maxLength={LIMITES_MOMENTO2.dia}
              placeholder="Días"
              aria-label={`Días, horario ${indice + 1}`}
              onChange={(e) => cambiar(indice, 'dia', e.target.value)}
            />
            <input
              type="text"
              className={styles.campo}
              value={fila.rango}
              maxLength={LIMITES_MOMENTO2.rango}
              placeholder="Horario"
              aria-label={`Horario, horario ${indice + 1}`}
              onChange={(e) => cambiar(indice, 'rango', e.target.value)}
            />
          </div>
        </div>
      ))}

      {puedeAgregarHorario(valores.horarios) && (
        <button
          type="button"
          className={`${styles.enlaceAccion} ${styles.enlaceInline}`}
          onClick={() => onCambio({ ...valores, horarios: agregarHorario(valores.horarios) })}
        >
          Agregar otro horario
        </button>
      )}
    </div>
  )
}

const PREGUNTAS_NOSOTROS = [
  { clave: 'desde', pregunta: '¿Desde qué año trabajan?' },
  { clave: 'quien', pregunta: '¿Quién atiende o lleva el negocio?' },
  { clave: 'distinto', pregunta: '¿Qué hacen distinto?' },
] as const

function CamposNosotros({ valores, onCambio }: Pick<Props, 'valores' | 'onCambio'>) {
  const base = useId()
  const cambiar = (clave: (typeof PREGUNTAS_NOSOTROS)[number]['clave'], valor: string) =>
    onCambio({ ...valores, nosotros: { ...valores.nosotros, [clave]: valor } })

  return (
    <div>
      {PREGUNTAS_NOSOTROS.map(({ clave, pregunta }) => (
        <div key={clave} className={styles.grupoEtiquetado}>
          <label htmlFor={`${base}-${clave}`} className={styles.etiqueta}>
            {pregunta}
          </label>
          {clave === 'distinto' ? (
            <>
              <textarea
                id={`${base}-${clave}`}
                rows={4}
                className={`${styles.campo} ${styles.areaTexto}`}
                value={valores.nosotros.distinto}
                maxLength={LIMITES_MOMENTO2.distinto}
                onChange={(e) => cambiar(clave, e.target.value)}
              />
              {valores.nosotros.distinto.length > UMBRAL_CONTADOR_DISTINTO && (
                <p className={styles.contador}>
                  {valores.nosotros.distinto.length} de {LIMITES_MOMENTO2.distinto}
                </p>
              )}
            </>
          ) : (
            <input
              id={`${base}-${clave}`}
              type="text"
              className={styles.campo}
              value={valores.nosotros[clave]}
              maxLength={LIMITES_MOMENTO2.microPregunta}
              onChange={(e) => cambiar(clave, e.target.value)}
            />
          )}
        </div>
      ))}
      <p className={styles.nota}>Si respondes solo una o dos, tu sitio muestra solo esas. Nada queda en blanco.</p>
    </div>
  )
}

function CamposFrase({ valores, onCambio }: Pick<Props, 'valores' | 'onCambio'>) {
  const base = useId()
  const { frase } = valores
  const cambiar = (campo: 'frase' | 'autor' | 'relacion', valor: string) =>
    onCambio({ ...valores, frase: { ...frase, [campo]: valor } })

  return (
    <div>
      <div className={styles.grupoEtiquetado}>
        <label htmlFor={`${base}-frase`} className={styles.etiqueta}>
          La frase
        </label>
        <textarea
          id={`${base}-frase`}
          rows={3}
          className={`${styles.campo} ${styles.areaTexto}`}
          value={frase.frase}
          maxLength={LIMITES_MOMENTO2.frase}
          onChange={(e) => cambiar('frase', e.target.value)}
        />
        {frase.frase.length > UMBRAL_CONTADOR_FRASE && (
          <p className={styles.contador}>
            {frase.frase.length} de {LIMITES_MOMENTO2.frase}
          </p>
        )}
      </div>
      <div className={styles.grupoEtiquetado}>
        <label htmlFor={`${base}-autor`} className={styles.etiqueta}>
          Nombre de quien la dijo
        </label>
        <input
          id={`${base}-autor`}
          type="text"
          className={styles.campo}
          value={frase.autor}
          maxLength={LIMITES_MOMENTO2.autor}
          onChange={(e) => cambiar('autor', e.target.value)}
        />
      </div>
      <div className={styles.grupoEtiquetado}>
        <label htmlFor={`${base}-relacion`} className={styles.etiqueta}>
          Relación (opcional)
        </label>
        <input
          id={`${base}-relacion`}
          type="text"
          className={styles.campo}
          value={frase.relacion}
          maxLength={LIMITES_MOMENTO2.relacion}
          placeholder="Por ejemplo: paciente o cliente desde 2020"
          onChange={(e) => cambiar('relacion', e.target.value)}
        />
      </div>
    </div>
  )
}
