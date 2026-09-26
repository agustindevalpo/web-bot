import styles from './Monograma.module.css'

// Las 4 variantes del handoff de diseño (bloque 3c, "Cuatro variantes, una
// por plantilla") — regla 02, verbatim: «Hereda la tipografía de su
// plantilla. Por eso son cuatro y no una: un monograma en Montserrat 800
// dentro de la Landing editorial se ve pegado.» Una variante por familia de
// templates, no una por template individual (Portfolio y Tienda comparten
// "sansPesado" en el handoff).
export type VarianteMonograma = 'serifCalado' | 'circuloPleno' | 'italicaSobreNegro' | 'sansPesado'

export type MonogramaProps = {
  iniciales: string
  variante: VarianteMonograma
}

const CLASE_POR_VARIANTE: Record<VarianteMonograma, string> = {
  serifCalado: styles.serifCalado,
  circuloPleno: styles.circuloPleno,
  italicaSobreNegro: styles.italicaSobreNegro,
  sansPesado: styles.sansPesado,
}

// Componente compartido (D3, regla de tres — igual que `Footer.tsx`), pero
// nace con un solo consumidor real (`landing/index.tsx`, variante
// "serifCalado"): las otras tres quedan listas para cuando RESTAURANTE,
// SERVICIOS y PORTFOLIO/TIENDA migren a este mismo slot de header (hoy esos
// 5 templates no tienen header — ver el comentario de alcance en
// `landing/index.tsx`).
//
// Regla 03 del handoff, verbatim: «Nunca un cuadrado redondeado con relleno
// plano. Es el gesto que grita "no puso su logo".» Por eso ninguna variante
// de acá usa el patrón `border-radius` + `background` plano que reemplaza
// (ver el CSS module: solo "circuloPleno" lleva fondo, y es un círculo con
// las letras EN COLOR sobre blanco, no relleno de color con letras blancas).
//
// Server Component puro, sin estado — mismo criterio que `Footer.tsx`. Si
// `iniciales` llega vacía (nombre de cliente vacío o no-string, ver
// `shared/iniciales.ts`) no se pinta nada en vez de un box vacío: un
// monograma sin letras es el mismo "hueco que grita" que la regla 03 ya
// prohíbe para el cuadrado con relleno plano.
export default function Monograma({ iniciales, variante }: MonogramaProps) {
  if (!iniciales) return null

  return <span className={`${styles.monograma} ${CLASE_POR_VARIANTE[variante]}`}>{iniciales}</span>
}
