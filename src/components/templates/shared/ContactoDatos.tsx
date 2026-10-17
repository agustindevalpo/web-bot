import { estiloCascada } from './navegacion'
import { buildWhatsAppUrl } from './enlaces'
import { datosContactoVista, type TarjetaContacto } from './vistaContacto'
import type { Horario } from './contenido'
import styles from './Contacto.module.css'

export type ContactoDatosProps = {
  horarios?: Horario[]
  telefono: string | null
  email: string | null
  direccion?: string | null
  // `reserva` (RESTAURANTE, 04): dirección a ancho completo antes de las demás
  // tarjetas, y WhatsApp + Correo en dos mitades iguales. `estandar` no cambia.
  variante?: 'estandar' | 'reserva'
}

// Columna derecha de Contacto (C1, sin mapa). Server Component. Sin horarios
// ni datos devuelve null: la columna entera desaparece y la sección no queda
// con un hueco.
export default function ContactoDatos({ horarios, telefono, email, direccion, variante = 'estandar' }: ContactoDatosProps) {
  const vista = datosContactoVista({ horarios, telefono, email, direccion })
  const reserva = variante === 'reserva'
  const tarjetas = vista.tarjetas.map((tarjeta) =>
    reserva && tarjeta.clave === 'telefono' && telefono
      ? { ...tarjeta, etiqueta: 'WhatsApp', href: buildWhatsAppUrl(telefono) }
      : tarjeta,
  )
  const tarjetaDireccion = reserva ? (tarjetas.find((tarjeta) => tarjeta.clave === 'direccion') ?? null) : null
  const tarjetasGrid = tarjetaDireccion ? tarjetas.filter((tarjeta) => tarjeta !== tarjetaDireccion) : tarjetas
  if (vista.horarios.length === 0 && tarjetas.length === 0) return null

  const renderTarjeta = (tarjeta: TarjetaContacto, cascada: number) => {
    const contenido = (
      <>
        <span className={styles.etiqueta}>{tarjeta.etiqueta}</span>
        <span className={tarjeta.clave === 'correo' ? styles.valorCorreo : styles.valor}>{tarjeta.valor}</span>
      </>
    )
    const estilo = estiloCascada(cascada)
    const clase = tarjeta.clave === 'direccion' ? `${styles.tarjeta} ${styles.tarjetaAncha}` : styles.tarjeta
    return tarjeta.href ? (
      <a key={tarjeta.clave} href={tarjeta.href} className={clase} data-dv-anim="up" style={estilo}>
        {contenido}
      </a>
    ) : (
      <div key={tarjeta.clave} className={clase} data-dv-anim="up" style={estilo}>
        {contenido}
      </div>
    )
  }

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
      {tarjetaDireccion && renderTarjeta(tarjetaDireccion, 2)}
      {tarjetasGrid.length > 0 && (
        <div className={reserva ? `${styles.tarjetas} ${styles.tarjetasIguales}` : styles.tarjetas}>
          {tarjetasGrid.map((tarjeta, indice) => renderTarjeta(tarjeta, 2 + (tarjetaDireccion ? 1 : 0) + indice))}
        </div>
      )}
    </div>
  )
}
