'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { filtrarSecciones, type SeccionSPA } from './navegacion'
import { resolverSeccionActiva } from './scrollspy'
import styles from './SeccionesSPA.module.css'

export type SeccionesSPAProps = {
  // Ya filtrada por el server en el `sections.ts` de cada template (Q2 en
  // design.md) — al menos un elemento; el primero queda activo al montar.
  secciones: SeccionSPA[]
  marca: ReactNode
  accionHeader?: ReactNode
  pie: ReactNode
  className?: string
  // Override puntual del shell de header (p. ej. TIENDA suma la franja de
  // promo y baja a 74px) — el resto de las plantillas usa el shell por defecto.
  claseHeader?: string
}

const UMBRAL_OBSERVER_CASCADA = 0.06
// Altura del header sticky (`.header`, SeccionesSPA.module.css, mismo valor
// que `--wb-spa-header-alto`) usada como `rootMargin` superior del scrollspy:
// una sección no se marca activa hasta que su borde cruza por debajo del
// header fijo. Duplicado a propósito en JS y CSS — no hay forma barata de
// leer un custom property de CSS module desde acá sin un `getComputedStyle`
// que no compra nada para un valor que ya es una constante del diseño.
const ALTO_HEADER_PX = 78

// Único componente cliente bajo `templates/` (handoff, "Implicancia
// arquitectónica"; design.md Q1). Header, footer y el contenido de cada
// sección llegan como slots ya renderizados en el server — este archivo no
// importa `SiteConfigDTO` ni ningún tipo de `src/application/` (D-02).
//
// Modo scroll largo con nav de anclas (decisión de Agustín, 2026-09-20 —
// contradice a propósito el handoff, README.md:133, ver docs/DECISIONES.md).
// Las cuatro secciones están siempre montadas y visibles, apiladas; el nav
// son `<a href="#id">`, no botones, así que sin JS la página funciona
// completa: todo el contenido está en el marcado y los saltos de ancla son
// nativos del navegador. Con JS hay dos IntersectionObserver independientes,
// con targets y ciclos de vida que no se pueden fusionar en uno solo:
// - Cascada de revelado (ya existía en S0): observa cada elemento suelto
//   `[data-dv-anim="up"]` dentro de las secciones, dispara una vez por
//   elemento y se desuscribe. Antes, con solo una sección visible a la vez,
//   disparaba todo junto al cambiar de tab; ahora que las cuatro están
//   siempre montadas, recién hace su trabajo real: revelar cada elemento
//   cuando entra al viewport por scroll.
// - Scrollspy (nuevo): observa cada sección completa (`[data-dv-section]`)
//   contra un `rootMargin` angosto pegado bajo el header, nunca se
//   desuscribe (tiene que seguir reaccionando en cada scroll, subiendo o
//   bajando) y su único efecto es actualizar qué link del nav se ve activo.
//   Compartir el observer de cascada le impondría su `threshold` de
//   revelado-de-elemento-suelto y su `unobserve` de una sola vez a un
//   trabajo que necesita lo contrario en ambos ejes.
export default function SeccionesSPA({ secciones, marca, accionHeader, pie, className, claseHeader }: SeccionesSPAProps) {
  // Re-filtra en el cliente aunque el server ya filtró antes de llamar acá
  // (Q2 en design.md): defensa en profundidad para el Requirement
  // "Data-Driven Navigation" — si un template olvidara filtrar, el wrapper
  // igual no muestra jamás un link o una sección vacíos.
  const seccionesVisibles = filtrarSecciones(secciones)
  // El acceso a `[0]` es opcional a propósito: un arreglo vacío es alcanzable
  // si un template llegara a pasar todas sus secciones sin contenido. En el
  // cimiento de seis plantillas, reventar acá no deja una sección en blanco:
  // tira abajo el sitio completo del cliente. Sin secciones no se renderiza
  // nada (ver el corte más abajo, después de los hooks). Antes de que el
  // scrollspy corrija el valor, es la sección con la que arranca la página
  // (siempre 'inicio' en la práctica), así que sigue siendo el default
  // correcto para el primer render.
  const [activaId, setActivaId] = useState(seccionesVisibles[0]?.id ?? '')
  const raizRef = useRef<HTMLDivElement>(null)
  // Nodo real de cada sección, indexado por id — poblado por el `ref`
  // callback de cada `<div data-dv-section>` más abajo. React garantiza que
  // estos callbacks corren durante el commit, ANTES de que el efecto de
  // abajo se ejecute, así que para cuando el scrollspy llama `.observe()`
  // el mapa ya tiene los 4 nodos reales que React montó. Reemplaza un
  // `raiz.querySelectorAll('[data-dv-section]')` que, aunque en teoría
  // debía resolver bien (`useEffect` corre después del commit), dependía de
  // que la query encontrara exactamente los nodos vigentes — con refs no
  // hay query de por medio, React entrega el nodo directamente.
  const seccionNodos = useRef(new Map<string, HTMLDivElement>())
  // Centinela de 1px al fondo de todo el documento (después del pie), para
  // el defecto real que encontró el orquestador en el navegador: una
  // sección final más baja que `viewport − fin de la franja` nunca alcanza
  // a cruzar la franja del header porque la página se queda sin scroll
  // antes — Contacto (455px) nunca entra a la franja [78px, 311px] porque
  // el scroll máximo de esta página (1254px) deja su borde superior en
  // 358px, siempre por debajo del límite de la franja. No es un ajuste de
  // franja: CUALQUIER sección final más baja que ese margen tiene el mismo
  // problema, así que la franja no es el lugar para arreglarlo. Ver el
  // razonamiento completo del observer más abajo.
  const finPaginaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raiz = raizRef.current
    if (!raiz) return

    // Gatea el guard de reduced-motion de motion.css para la cascada de
    // revelado. Sin JS este atributo nunca se setea y los elementos con
    // `data-dv-anim="up"` quedan visibles desde el inicio — degrada bien, no
    // rompe el contenido (motion.css:41-49).
    raiz.setAttribute('data-dv-ready', '')

    const observerCascada = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          entrada.target.setAttribute('data-dv-in', '')
          observerCascada.unobserve(entrada.target)
        }
      },
      { threshold: UMBRAL_OBSERVER_CASCADA },
    )
    raiz.querySelectorAll('[data-dv-anim="up"]').forEach((elemento) => observerCascada.observe(elemento))

    // `rootMargin` recorta el viewport de intersección a una franja angosta
    // pegada bajo el header: arriba, `-ALTO_HEADER_PX` para no contar el
    // espacio que el header sticky tapa; abajo, `-65%` para que la sección
    // se marque activa cuando su borde superior cruza cerca del techo de la
    // pantalla, no apenas asoma por abajo. `threshold: 0` porque lo que
    // importa es el cruce del borde, no cuánto porcentaje del área de la
    // sección quedó visible (las secciones difieren mucho en alto: el hero
    // es `100vh`, Contacto puede ser mucho más bajo).
    //
    // `interseccionPorId` guarda el ÚLTIMO estado conocido (true/false) de
    // CADA sección, actualizado con TODAS las entradas del batch, no solo
    // las que llegan en `true`. Es necesario porque el `rootMargin` de
    // arriba es más angosto que el alto de más de una sección real (p. ej.
    // Nosotros, ~206px, más baja que la franja de ~233px): en un salto de
    // scroll grande (instantáneo, sin pasos intermedios) es perfectamente
    // posible que DOS secciones crucen la franja en el MISMO batch — p. ej.
    // Servicios (todavía casi completa dentro de la franja) Y Nosotros
    // (recién asomando por abajo) reportan `isIntersecting: true` a la vez.
    // Elegir "la última entrada del array que sea true" dependía del orden
    // en que el navegador entrega las entradas (no garantizado por spec) y
    // podía terminar en la sección equivocada, o en ninguna actualización
    // visible si ese orden resultaba coincidir con la ya activa. Con el mapa
    // persistente, la sección activa se recalcula de forma determinística en
    // cada callback: la ÚLTIMA (más abajo en el documento — `seccionNodos`
    // conserva el orden de inserción, que es el orden en que React montó los
    // `ref` de abajo, o sea el orden del documento) entre las que están
    // MARCADAS `true` en este momento — no importa en qué orden llegaron las
    // entradas del batch ni cuántas cambiaron de estado a la vez. Recorre
    // `seccionNodos.current.keys()` (un ref, no necesita estar en las deps
    // del efecto) en vez de `seccionesVisibles` (prop derivada, cambiaría de
    // identidad en cada render) para no atarse a esa dependencia.
    const interseccionPorId = new Map<string, boolean>()
    // `true` cuando el centinela del fondo (`finPaginaRef`) está en el
    // viewport — o sea, cuando la página está en su scroll máximo (o a un
    // pixel o dos de distancia; un elemento real vía IntersectionObserver
    // no necesita el margen de error a mano que sí necesitaría comparar
    // `scrollY + innerHeight` contra `scrollHeight`). Vive en el closure del
    // efecto, no en un `ref` de React: nace y muere junto con los dos
    // observers de acá abajo, no necesita sobrevivir a un re-render.
    let enFinDePagina = false

    // Única función que decide `activaId`, llamada desde AMBOS observers de
    // abajo — el de la franja y el del centinela de fondo. Es la pieza que
    // evita que los dos observers "compitan": si cada uno llamara a
    // `setActivaId` con su propio criterio de forma independiente, el
    // resultado final dependería de cuál de los dos disparó su callback más
    // tarde (ninguna garantía del spec sobre eso), y justo al llegar al
    // fondo de la página los dos criterios coexisten y DISCREPAN a
    // propósito (la franja todavía marca la penúltima sección; el centinela
    // ya sabe que estamos al fondo). Centralizando la decisión acá, el
    // resultado es una función pura del estado conocido en ESE momento, sin
    // importar qué observer la disparó: "fin de página" gana siempre que
    // sea cierto, y solo si no lo es se usa la sección de la franja. Esto es
    // también lo que evita que este mecanismo "pelee" con la franja al
    // volver a subir: en cuanto el centinela deja de intersectar,
    // `enFinDePagina` vuelve a `false` y esta función vuelve a depender
    // solo de la franja, sin ningún paso adicional de "desbloqueo".
    // Decisión pura extraída a `resolverSeccionActiva` (shared/scrollspy.ts) —
    // pineada con tests unitarios ahí, sin stubear IntersectionObserver.
    function recalcularActiva() {
      setActivaId((activaActual) =>
        resolverSeccionActiva(
          Array.from(seccionNodos.current.keys()),
          interseccionPorId,
          enFinDePagina,
          window.scrollY,
          activaActual,
        ),
      )
    }

    const observerScrollspy = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          interseccionPorId.set(entrada.target.id, entrada.isIntersecting)
        }
        recalcularActiva()
      },
      { rootMargin: `-${ALTO_HEADER_PX}px 0px -65% 0px`, threshold: 0 },
    )
    seccionNodos.current.forEach((nodo) => observerScrollspy.observe(nodo))

    // Defecto real encontrado en el navegador (no en tests): una sección
    // final más baja que `viewport − fin de la franja` nunca llega a cruzar
    // la franja de arriba, porque la página se queda sin scroll antes de que
    // eso pase — no es un problema de AJUSTAR la franja (cualquier valor deja
    // afuera a alguna sección final lo bastante corta), es estructural: la
    // franja vive a una distancia fija del techo del viewport, pero el techo
    // de la ÚLTIMA sección solo puede acercarse al techo del viewport hasta
    // donde el scroll se lo permita, y en una página corta eso nunca alcanza
    // la franja. Se resuelve con una señal aparte, no con más matemática de
    // franja: un centinela de 1px al fondo de todo el documento (después del
    // pie, ver el JSX). Cuando ese centinela entra al viewport, estamos en
    // el scroll máximo posible (o a un pixel/dos, por cómo trunca/redondea
    // el layout) — ahí no importa qué diga la franja, la última sección es
    // la correcta. `threshold: 0` alcanza: un target de 1px no necesita más
    // resolución que "¿está tocando el viewport o no?".
    const observerFinPagina = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) enFinDePagina = entrada.isIntersecting
        recalcularActiva()
      },
      { threshold: 0 },
    )
    if (finPaginaRef.current) observerFinPagina.observe(finPaginaRef.current)

    return () => {
      observerCascada.disconnect()
      observerScrollspy.disconnect()
      observerFinPagina.disconnect()
    }
  }, [])

  // Después de los hooks, nunca antes: React exige que se ejecuten siempre en
  // el mismo orden.
  if (seccionesVisibles.length === 0) return null

  return (
    <div ref={raizRef} className={className ? `${styles.shell} ${className}` : styles.shell}>
      <header className={claseHeader ?? styles.header}>
        <div className={styles.marca}>{marca}</div>
        <nav className={styles.nav}>
          {seccionesVisibles.map((seccion) => (
            // `<a href="#id">`, no botón: funciona sin JS (salto de ancla
            // nativo) y es enlazable/compartible. El resaltado del link
            // activo lo decide el scrollspy de arriba, no el click — un
            // click igual dispara el salto nativo del navegador y de ahí en
            // adelante el scroll real es la fuente de verdad.
            <a
              key={seccion.id}
              href={`#${seccion.id}`}
              aria-current={seccion.id === activaId ? 'true' : undefined}
              className={seccion.id === activaId ? `${styles.navItem} ${styles.navItemActivo}` : styles.navItem}
            >
              {seccion.etiqueta}
            </a>
          ))}
        </nav>
        {accionHeader && <div className={styles.accion}>{accionHeader}</div>}
      </header>

      <main className={styles.main}>
        {/* `id` es el target de las anclas del nav de arriba. Sin
            `data-dv-active`/`data-dv-anim="fade"`: esos existían para el modo
            de pestañas (una sola sección montada visible a la vez) y ya no
            tienen sentido con las cuatro siempre visibles — motion.css ya no
            trae la regla que los consumía. El `ref` llena `seccionNodos`
            (leído por el scrollspy del efecto de arriba); se limpia a sí
            mismo si el nodo se desmonta, aunque en la práctica las cuatro
            secciones nunca se desmontan una vez montadas. */}
        {seccionesVisibles.map((seccion) => (
          <div
            key={seccion.id}
            id={seccion.id}
            data-dv-section
            ref={(nodo) => {
              if (nodo) seccionNodos.current.set(seccion.id, nodo)
              else seccionNodos.current.delete(seccion.id)
            }}
          >
            {seccion.contenido}
          </div>
        ))}
      </main>

      {pie}

      {/* Centinela de fin de página para el scrollspy (ver el comentario
          largo en el efecto de arriba): 1px real, no cero, para no
          depender de cómo cada navegador resuelve la intersección de un
          elemento de área cero. `aria-hidden` porque no es contenido, es
          un marcador de layout — la lupa de accesibilidad no tiene nada
          que leer acá. */}
      <div ref={finPaginaRef} className={styles.finPagina} aria-hidden="true" />
    </div>
  )
}
