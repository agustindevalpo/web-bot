import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDestacado, LegalLayout, LegalSeccion } from '../_legal/LegalLayout'
import { PRECIO } from '../_landing/copy'
import {
  CUPOS_PROMO,
  PRECIO_MULTIPAGINA,
  PRECIO_PROMO,
  PRECIO_SITIO,
  RENOVACION_ANUAL,
  formatCLP,
} from '../_landing/precios'

export const metadata: Metadata = {
  title: 'Términos y condiciones — Devalpo',
  description:
    'Términos y condiciones del servicio de sitios web de Devalpo Soluciones Tecnológicas SpA: precios, proceso, derecho a retracto y garantía de publicación.',
}

export default function TerminosPage() {
  return (
    <LegalLayout titulo="Términos y condiciones" actualizado="26 de septiembre de 2026">
      <LegalSeccion titulo="1. Identificación del proveedor">
        <p>
          Este servicio es prestado por <strong>Devalpo Soluciones Tecnológicas SpA</strong>, RUT{' '}
          <strong>77.119.936-4</strong>, con domicilio en Reñaca Norte 265, oficina 510, Viña del Mar, Chile
          (&ldquo;Devalpo&rdquo;, &ldquo;nosotros&rdquo;). Puedes contactarnos en{' '}
          <a href="mailto:team@devalpo.cl">team@devalpo.cl</a>.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="2. Qué es el servicio">
        <p>
          WebBot es un servicio de Devalpo que arma tu sitio web a partir de una conversación con un asistente de
          chat: nos cuentas los datos de tu negocio, revisas una demo con esa información y, si te sirve, publicamos
          la versión final en tu propio dominio. Ofrecemos dos modalidades: un sitio de una página y un sitio de
          varias páginas.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="3. Precios y qué incluyen">
        <p>
          El sitio de una página tiene un valor de <strong>{formatCLP(PRECIO_SITIO)}</strong>. Como precio de
          lanzamiento, los primeros {CUPOS_PROMO} clientes pagan <strong>{formatCLP(PRECIO_PROMO)}</strong>; agotados
          esos cupos, rige el precio normal. El sitio de varias páginas tiene un valor de{' '}
          <strong>{formatCLP(PRECIO_MULTIPAGINA)}</strong>. Todos los valores están expresados en pesos chilenos
          (CLP) y corresponden a un pago único, sin mensualidades.
        </p>
        <p>El precio incluye:</p>
        <ul>
          {PRECIO.incluye.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSeccion>

      <LegalSeccion titulo="4. Proceso de contratación">
        <p>
          El proceso es el siguiente: (1) conversas con el asistente de chat y ves una demo gratuita de tu sitio; (2)
          revisas el resultado antes de pagar; (3) si decides continuar, pagas a través del link de pago de Mercado
          Pago; (4) confirmamos manualmente tu pago; (5) publicamos tu sitio en tu propio dominio dentro de 1 día
          hábil desde la confirmación. Antes de publicar tienes derecho a una ronda de ajustes sobre el sitio
          revisado. Durante el primer año puedes solicitarnos ediciones de contenido (textos, fotos, datos de
          contacto).
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="5. Renovación anual">
        <p>
          Desde el segundo año, el servicio tiene una renovación anual de <strong>{formatCLP(RENOVACION_ANUAL)}</strong>{' '}
          que cubre el hosting y el dominio por doce meses más. Te avisaremos con anticipación antes de que venza la
          renovación. Si no la pagas, tu sitio puede quedar pausado hasta que se regularice el pago; te
          notificaremos antes de que eso ocurra.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="6. Dominio">
        <p>El dominio de tu sitio se registra a nombre de tu negocio, no a nombre de Devalpo.</p>
      </LegalSeccion>

      <LegalSeccion titulo="7. Derecho a retracto y garantía de publicación">
        <LegalDestacado>
          <p>
            <strong>Derecho a retracto:</strong> de acuerdo con el artículo 3 bis, letra b), de la Ley 19.496 sobre
            Protección de los Derechos de los Consumidores, el derecho a retracto <strong>no aplica</strong> a este
            contrato. La razón es que tú revisas y apruebas el sitio terminado <em>antes</em> de pagar: el pago
            ocurre solo cuando ya conoces el resultado final del servicio.
          </p>
          <p>
            <strong>Garantía de publicación:</strong> como compensación, si tu sitio no queda publicado en tu dominio
            dentro de <strong>10 días corridos</strong> desde la confirmación de tu pago, por causas atribuibles a
            Devalpo, te devolvemos el pago íntegro. Para solicitarlo, escríbenos a{' '}
            <a href="mailto:team@devalpo.cl">team@devalpo.cl</a>.
          </p>
        </LegalDestacado>
      </LegalSeccion>

      <LegalSeccion titulo="8. Obligaciones del cliente">
        <p>
          Al contratar el servicio, te comprometes a entregarnos información veraz sobre tu negocio y a contar con
          los derechos necesarios sobre los textos, imágenes y logos que nos proporciones para construir tu sitio.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="9. Propiedad intelectual">
        <p>
          Los contenidos que nos entregas (textos, imágenes, logos, información de tu negocio) siguen siendo tuyos.
          La plantilla, el código y la infraestructura técnica del sitio son propiedad de Devalpo; mientras el
          servicio esté activo, se te otorga una licencia para usar tu sitio con esos elementos.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="10. Limitación de responsabilidad">
        <p>
          Devalpo responde por la prestación del servicio conforme a estos términos. No respondemos por daños
          derivados de causas fuera de nuestro control razonable (por ejemplo, caídas de proveedores de
          infraestructura de terceros) ni por el contenido que tú mismo nos entregues para publicar. Ninguna
          cláusula de este documento pretende limitar derechos irrenunciables del consumidor bajo la Ley 19.496; en
          caso de conflicto, prevalece la ley.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="11. Datos personales">
        <p>
          El tratamiento de tus datos personales se describe en nuestra{' '}
          <Link href="/privacidad">Política de Privacidad</Link>.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="12. Reclamos">
        <p>
          Si tienes un reclamo, escríbenos a <a href="mailto:team@devalpo.cl">team@devalpo.cl</a>. También tienes
          derecho a recurrir al Servicio Nacional del Consumidor (SERNAC).
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="13. Ley aplicable y domicilio">
        <p>
          Estos términos se rigen por las leyes de Chile, en particular la Ley 19.496. Cualquier controversia se
          someterá a los tribunales competentes conforme a esa ley, sin perjuicio de los derechos que ella te
          reconoce como consumidor.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="14. Vigencia y cambios">
        <p>
          Estos términos rigen desde su publicación y pueden actualizarse. Si hacemos cambios relevantes, lo
          indicaremos en esta misma página. Última actualización: 26 de septiembre de 2026.
        </p>
      </LegalSeccion>
    </LegalLayout>
  )
}
