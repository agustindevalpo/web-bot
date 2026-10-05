import type { Ref } from 'react'
import styles from './completar.module.css'
import { BarraAvance } from '../BarraAvance'
import type { VistaMomento2 } from '@/application/shared/momento2'
import { TITULO_TAREA, accionDeTarea, detalleDeTarea, textoAntesala, tituloResumen, zonasAntesala } from './textos'

interface Props {
  vista: VistaMomento2
  template: string | null
  onEditar: (indice: number) => void
  titleRef: Ref<HTMLHeadingElement>
}

// Resumen del momento 2 (M3 parcial, M5 completo): una fila por tarea con su
// estado y la antesala de "Después del pago". Sin candado, sin la palabra
// "bloqueado" y sin subida de archivos: logo y fotos los carga Devalpo.
export function Resumen({ vista, template, onEditar, titleRef }: Props) {
  const zonas = zonasAntesala(template)

  return (
    <div>
      <h1 ref={titleRef} tabIndex={-1} className={styles.tituloResumen}>
        {tituloResumen(vista.avance)}
      </h1>
      <BarraAvance avance={vista.avance} />

      <ul className={styles.listaTareas}>
        {vista.tareas.map((tarea, indice) => {
          const detalle = detalleDeTarea(tarea, vista)
          const completa = tarea.estado === 'completa'
          return (
            <li key={tarea.id} className={styles.filaTarea}>
              <span className={`${styles.circulo} ${completa ? styles.circuloLleno : ''}`} aria-hidden="true">
                {completa ? '✓' : ''}
              </span>
              <div className={styles.textoTarea}>
                <p className={styles.tituloTarea}>{TITULO_TAREA[tarea.id]}</p>
                {detalle && <p className={styles.detalleTarea}>{detalle}</p>}
              </div>
              <button
                type="button"
                className={styles.accionFila}
                aria-label={`${accionDeTarea(tarea)}: ${TITULO_TAREA[tarea.id]}`}
                onClick={() => onEditar(indice)}
              >
                {accionDeTarea(tarea)}
              </button>
            </li>
          )
        })}
      </ul>

      <section className={styles.antesala} aria-labelledby="antesala-titulo">
        <p id="antesala-titulo" className={`${styles.rotulo} ${styles.rotuloGris}`}>
          Después del pago
        </p>
        <ul className={`${styles.zonas} ${zonas.length === 4 ? styles.zonasCuatro : ''}`}>
          {zonas.map((zona) => (
            <li key={zona} className={styles.zona}>
              {zona}
            </li>
          ))}
        </ul>
        <p className={styles.textoAntesala}>{textoAntesala(template, vista.avance)}</p>
      </section>
    </div>
  )
}
