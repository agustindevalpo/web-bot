import styles from './DemoCTA.module.css'
import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from '@/app/_landing/precios'
import { TarjetaAvance } from './TarjetaAvance'
import { VistaPreviaSitio } from './VistaPreviaSitio'
import { urlSitioDemo } from './urlSitioDemo'
import { bannerPago, clasificarEnlacePago, contrastarModoPago, normalizarModoPagoDeclarado, resolverEnlacePago } from './hrefPago'

// Link de pago único de Mercado Pago (WB-43). Debe ser NEXT_PUBLIC_* porque este
// componente se renderiza en el cliente (lo importa ChatWidget, 'use client').
// Sin la variable, el CTA cae a /login.
const ENLACE_PAGO = resolverEnlacePago(process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL)
// Diagnóstico del mismo valor de env: clasifica la URL (sandbox de pagos,
// D-22) y la contrasta contra NEXT_PUBLIC_PAGOS_MODO, la intención declarada
// explícitamente por quien configuró el entorno. El contraste, no la
// clasificación sola, decide qué banner mostrar (ver debajo).
const DIAGNOSTICO_PAGO = clasificarEnlacePago(process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL)
const MODO_PAGO_DECLARADO = normalizarModoPagoDeclarado(process.env.NEXT_PUBLIC_PAGOS_MODO)
const CONTRASTE_PAGO = contrastarModoPago(process.env.NEXT_PUBLIC_PAGOS_MODO, DIAGNOSTICO_PAGO)
// La evidencia sola basta para avisar: un link de pruebas sin flag declarado
// también levanta el banner. Ver `bannerPago` para el porqué.
const BANNER_PAGO = bannerPago(CONTRASTE_PAGO, DIAGNOSTICO_PAGO)

export interface DemoCTAProps {
  subdominioDemo: string
  // Nombre del negocio, para el titular del reveal.
  nombre: string
  // Plantilla del sitio: decide la invitación de la tarjeta de avance.
  template: string | null
  // Avance ya calculado con `calcularAvance` (35 % sin tareas, techo 80 %).
  avance: number
}

// Reveal (R2, R3, E1): primero el sitio, después el avance con la invitación a
// completarlo y al final la caja de pago. El pago nunca depende del momento 2.
export function DemoCTA({ subdominioDemo, nombre, template, avance }: DemoCTAProps) {
  const urlDemo = urlSitioDemo(subdominioDemo)
  const titulo = nombre.trim() ? `Así se ve ${nombre.trim()}` : 'Así se ve tu sitio'

  return (
    <div className={styles.reveal}>
      <div className={styles.columnaSitio}>
        <p className={styles.rotulo}>Tu sitio</p>
        <h1 className={styles.titulo}>{titulo}</h1>
        <VistaPreviaSitio url={urlDemo} />
        <a href={urlDemo} target="_blank" rel="noopener noreferrer" className={styles.verCompleto}>
          Abrir el sitio completo →
        </a>
      </div>

      <div className={styles.columnaAccion}>
        <TarjetaAvance avance={avance} template={template} />
        <CajaPago />
      </div>
    </div>
  )
}

function CajaPago() {
  const promo = estadoPromo()

  return (
    <section className={styles.caja} aria-labelledby="pago-titulo">
      <p className={styles.rotulo}>Tu sitio propio</p>
      <h2 id="pago-titulo" className={styles.tituloPago}>
        Listo en 1 día hábil
      </h2>

      {BANNER_PAGO === 'discrepancia' && (
        // El estado que justifica todo el contraste: lo declarado y la URL real
        // no coinciden. Banner distinto y más fuerte que el de sandbox tranquilo
        // — quien lo vea tiene que enterarse de las dos partes del problema.
        <p className={styles.alertaDiscrepancia} role="alert">
          🚨{' '}
          {MODO_PAGO_DECLARADO === 'produccion'
            ? 'Este entorno está declarado como PRODUCCIÓN, pero el link de pago configurado apunta al ambiente de PRUEBAS de Mercado Pago: los clientes reales no van a poder pagar.'
            : 'Este entorno está declarado como PRUEBA, pero el link de pago configurado es el real de Mercado Pago (mpago.la): se está cobrando dinero de verdad.'}
        </p>
      )}

      {BANNER_PAGO === 'sandbox' && (
        <p className={styles.alertaSandbox} role="alert">
          ⚠️ Este entorno apunta al ambiente de pruebas de Mercado Pago: ningún pago acá mueve dinero real.
        </p>
      )}

      <div className={styles.precio}>
        <div className={styles.precioFila}>
          <span className={styles.precioActual}>{formatCLP(promo.agotada ? PRECIO_SITIO : PRECIO_PROMO)}</span>
          <span className={styles.precioDetalle}>pago único</span>
        </div>
        {promo.agotada ? (
          <span className={styles.precioNota}>Cupos de lanzamiento agotados</span>
        ) : (
          <span className={styles.precioNota}>
            <span className={styles.precioTachado}>{formatCLP(PRECIO_SITIO)}</span> Precio de lanzamiento · quedan{' '}
            {promo.restantes} cupos
          </span>
        )}
      </div>

      <ul className={styles.vinetas}>
        <li>Tu dominio propio y el sitio publicado</li>
        <li>Agregamos tu logo y tus fotos</li>
        <li>Sin contratos ni permanencia mínima</li>
      </ul>

      {/* Antes del botón, no después: la exclusión del retracto (art. 3 bis b,
          Ley 19.496) tiene que informarse antes de contratar. */}
      <p className={styles.retracto}>
        Al pagar aceptas los{' '}
        <a href="/terminos" target="_blank" rel="noopener noreferrer">
          Términos y condiciones
        </a>
        . Como revisas y apruebas tu sitio antes de pagar, no aplica el derecho a retracto (art. 3 bis, Ley
        19.496). Si no lo publicamos en 10 días por causas nuestras, te devolvemos el pago.
      </p>

      <a
        href={ENLACE_PAGO.href}
        className={styles.boton}
        {...(ENLACE_PAGO.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        Quiero mi sitio real
      </a>

      <p className={styles.disclaimer}>
        {ENLACE_PAGO.externo && (
          <>Pago único por Mercado Pago. Después del pago te contactamos para activar tu sitio en 1 día. </>
        )}
        Sin contratos ni permanencia mínima.
      </p>
    </section>
  )
}
