import { estiloCascada } from './navegacion'
import { datosContactoVista } from './vistaContacto'
import type { Horario } from './contenido'
import styles from './Contacto.module.css'

export type ContactoDatosProps = {
  horarios?: Horario[]
  telefono: string | null
  email: string | null
}

// Columna derecha de Contacto (C1, sin mapa). Server Component. Sin horarios
// ni datos devuelve null: la columna entera desaparece y la sección no queda
// con un hueco.
export default function ContactoDatos({ horarios, telefono, email }: ContactoDatosProps) {
  const vista = datosContactoVista({ horarios, telefono, email })
  if (vista.horarios.length === 0 && vista.tarjetas.length === 0) return null

  return (
    <div className={styles.datos}>
      {vista.horarios.length > 0 && (
        <div className={styles.tarjetaHorarios} data-dv-anim="up" style={estiloCascada(1)}>
          <div className={styles.etiqueta}>Horarios</div>
          <ul className={styles.filas}>
            {vista.horarios.map((horario) => (
              <li key={`${horario.dia}-${horario.rango}`} className={styles.fila}>
                <span>{horario.dia}</span>
                <span className={styles.rango}>{horario.rango}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {vista.tarjetas.length > 0 && (
        <div className={styles.tarjetas}>
          {vista.tarjetas.map((tarjeta, indice) => {
            const contenido = (
              <>
                <span className={styles.etiqueta}>{tarjeta.etiqueta}</span>
                <span className={tarjeta.clave === 'correo' ? styles.valorCorreo : styles.valor}>{tarjeta.valor}</span>
              </>
            )
            const estilo = estiloCascada(2 + indice)
            return tarjeta.href ? (
              <a key={tarjeta.clave} href={tarjeta.href} className={styles.tarjeta} data-dv-anim="up" style={estilo}>
                {contenido}
              </a>
            ) : (
              <div key={tarjeta.clave} className={styles.tarjeta} data-dv-anim="up" style={estilo}>
                {contenido}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
