import { estiloCascada } from '@/components/templates/shared/navegacion'
import type { PlatoCarta } from '@/application/shared/carta'
import { TEXTO_ENLACE_CARTA, TEXTO_ENLACE_PDF, type CartaVista } from './sections'
import styles from './Carta.module.css'

// Carta tipográfica (S4, 04-RESTAURANTE.md "Carta"). Server Component puro. Es
// la pieza que se ve bien sin una sola foto: dos formas según haya precios.
// - Con guías (algún plato con precio): nombre · guía punteada · precio; un
//   plato sin precio lleva solo el nombre, sin guía.
// - Grande (ningún precio): una columna de nombres a 44px.
// La sección vive dentro del `div#carta` de SeccionesSPA.

function FilaGuias({ plato }: { plato: PlatoCarta }) {
  return (
    <li className={styles.plato}>
      <span className={styles.nombre}>{plato.nombre}</span>
      {plato.precio && (
        <>
          <span className={styles.guia} aria-hidden="true" />
          <span className={styles.precio}>{plato.precio}</span>
        </>
      )}
    </li>
  )
}

function ListaGuias({ platos }: { platos: PlatoCarta[] }) {
  return (
    <ul className={styles.lista}>
      {platos.map((plato, indice) => (
        <FilaGuias key={`${plato.nombre}-${indice}`} plato={plato} />
      ))}
    </ul>
  )
}

export default function Carta({ carta }: { carta: CartaVista }) {
  const { forma, grupos, hayCategorias, columnasSinCategorias } = carta
  const hayPie = carta.nota !== null || carta.enlaceWhatsapp !== null || carta.enlacePdf !== null

  return (
    <section className={styles.seccion}>
      <div className={styles.eyebrow} data-dv-anim="up" style={estiloCascada(0)}>
        {carta.eyebrow}
      </div>
      <h2 className={styles.titulo} data-dv-anim="up" style={estiloCascada(1)}>
        {carta.titulo}
      </h2>

      {forma === 'guias' && hayCategorias && (
        <div className={styles.categorias}>
          {grupos.map((grupo, indice) => (
            <div key={`${grupo.categoria ?? 'sin-categoria'}-${indice}`} data-dv-anim="up" style={estiloCascada(Math.min(indice, 4))}>
              {grupo.categoria && <h3 className={styles.categoria}>{grupo.categoria}</h3>}
              <ListaGuias platos={grupo.platos} />
            </div>
          ))}
        </div>
      )}

      {forma === 'guias' && !hayCategorias && columnasSinCategorias && (
        <div className={columnasSinCategorias.length > 1 ? styles.dosColumnas : styles.unaColumna}>
          {columnasSinCategorias.map((platos, indice) => (
            <div key={indice} data-dv-anim="up" style={estiloCascada(indice)}>
              <ListaGuias platos={platos} />
            </div>
          ))}
        </div>
      )}

      {forma === 'grande' && (
        <div className={styles.grande}>
          {grupos.map((grupo, indiceGrupo) => (
            <div key={`${grupo.categoria ?? 'sin-categoria'}-${indiceGrupo}`} className={styles.grupoGrande}>
              {grupo.categoria && <h3 className={styles.categoria}>{grupo.categoria}</h3>}
              <ul className={styles.listaGrande}>
                {grupo.platos.map((plato, indice) => (
                  <li
                    key={`${plato.nombre}-${indice}`}
                    className={styles.platoGrande}
                    data-dv-anim="up"
                    style={estiloCascada(Math.min(indice, 4))}
                  >
                    {plato.nombre}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hayPie && (
        <div className={styles.pie} data-dv-anim="up" style={estiloCascada(0)}>
          {carta.nota && <p className={styles.nota}>{carta.nota}</p>}
          {(carta.enlacePdf || carta.enlaceWhatsapp) && (
            <div className={styles.enlaces}>
              {carta.enlacePdf && (
                <a href={carta.enlacePdf} target="_blank" rel="noopener" className={styles.enlace}>
                  {TEXTO_ENLACE_PDF}
                </a>
              )}
              {carta.enlaceWhatsapp && (
                <a href={carta.enlaceWhatsapp} target="_blank" rel="noopener noreferrer" className={styles.enlace}>
                  {TEXTO_ENLACE_CARTA}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
