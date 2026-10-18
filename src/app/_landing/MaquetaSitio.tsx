// Mini-maqueta de uno de los tres sitios demo reales. Se usa en la ventana del
// hero (HeroVisual) y en las vistas previas de las tarjetas de "Ejemplos". Es
// markup puro: sirve tanto en componentes de servidor como de cliente.
import styles from '../page.module.css'
import type { Maqueta } from './copy'

export function MaquetaSitio({ m }: { m: Maqueta }) {
  return (
    <div className={styles.maqueta} style={{ '--acento': m.acento, '--texto-acento': m.textoAcento } as React.CSSProperties}>
      <div className={styles.maquetaBarra}>
        <span className={styles.maquetaMarca}>
          <span className={styles.maquetaLogo}>{m.iniciales}</span>
          <span className={styles.maquetaNombre}>{m.nombre}</span>
        </span>
        <span className={styles.maquetaCta}>{m.cta}</span>
      </div>
      <div className={styles.maquetaTitulo}>
        {m.titulo.map((linea, i) => (
          <span key={linea}>
            {i > 0 && <br />}
            {linea}
          </span>
        ))}
      </div>
      {m.tipo === 'carta' && (
        <>
          <p className={styles.maquetaDescripcion}>{m.descripcion}</p>
          <div className={styles.maquetaCarta}>
            <div className={styles.maquetaEtiqueta}>{m.etiqueta}</div>
            {m.filas.map((fila) => (
              <div key={fila.texto} className={styles.maquetaFila}>
                <span>{fila.texto}</span>
                {fila.valor && (
                  <>
                    <span className={styles.maquetaPuntos} />
                    <strong>{fila.valor}</strong>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {m.tipo === 'catalogo' && (
        <>
          <p className={styles.maquetaDescripcion}>{m.descripcion}</p>
          <div className={styles.maquetaProductos}>
            {m.productos.map((producto) => (
              <div key={producto}>
                <div className={styles.maquetaFoto} />
                <div className={styles.maquetaProducto}>{producto}</div>
              </div>
            ))}
          </div>
          <div className={styles.maquetaPie}>{m.pie}</div>
        </>
      )}
      {m.tipo === 'servicios' && (
        <>
          {m.servicios.map((servicio, i) => (
            <div key={servicio} className={styles.maquetaServicio}>
              <span className={styles.maquetaNumero}>{String(i + 1).padStart(2, '0')}</span>
              <span>{servicio}</span>
            </div>
          ))}
          <div className={styles.maquetaFranja}>
            <span>{m.franja.etiqueta}</span>
            <strong>{m.franja.valor}</strong>
          </div>
        </>
      )}
    </div>
  )
}
