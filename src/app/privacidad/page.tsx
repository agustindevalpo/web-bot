import type { Metadata } from 'next'
import { LegalLayout, LegalSeccion } from '../_legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Política de privacidad — Devalpo',
  description:
    'Política de privacidad de Devalpo Soluciones Tecnológicas SpA: qué datos recopilamos en WebBot, para qué los usamos, con quién los compartimos y cómo ejercer tus derechos.',
}

export default function PrivacidadPage() {
  return (
    <LegalLayout titulo="Política de privacidad" actualizado="26 de septiembre de 2026">
      <LegalSeccion titulo="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de tus datos personales es <strong>Devalpo Soluciones Tecnológicas SpA</strong>,
          RUT <strong>77.119.936-4</strong>, con domicilio en Reñaca Norte 265, oficina 510, Viña del Mar, Chile.
          Puedes contactarnos en <a href="mailto:team@devalpo.cl">team@devalpo.cl</a>.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="2. Qué datos recopilamos">
        <p>Recopilamos los siguientes datos, según cómo interactúes con WebBot:</p>
        <ul>
          <li>
            El contenido de la conversación que tienes con el asistente de chat (la demo), incluyendo lo que nos
            cuentas sobre tu negocio.
          </li>
          <li>Tu nombre y correo electrónico, si nos los entregas como lead al terminar la demo.</li>
          <li>El correo electrónico que usas para iniciar sesión en tu cuenta, si contratas el servicio.</li>
          <li>
            Una referencia de tu pago, ingresada manualmente por nuestro equipo al confirmar tu transacción con
            Mercado Pago (no recibimos tus datos de tarjeta ni de pago; esos quedan en Mercado Pago).
          </li>
        </ul>
      </LegalSeccion>

      <LegalSeccion titulo="3. Para qué usamos tus datos">
        <p>
          Usamos tus datos para construir la demo y el sitio final con la información de tu negocio, para
          contactarte respecto del servicio, para gestionar tu cuenta si contratas y para llevar registro de tu
          pago.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="4. Base para el tratamiento">
        <p>
          Tratamos tus datos con tu consentimiento, al usar la demo o entregarnos tu correo, y en base al contrato de
          servicio cuando contratas WebBot.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="5. Con quién compartimos tus datos">
        <p>Para operar el servicio, algunos datos pasan por proveedores externos que actúan por nuestro encargo:</p>
        <ul>
          <li>Railway: hosting de la aplicación y de la base de datos.</li>
          <li>Resend: envío de correos electrónicos.</li>
          <li>Cloudflare: proxy de dominios personalizados de los sitios publicados.</li>
          <li>
            Anthropic: solo si tu cuenta tiene el asistente de chat con inteligencia artificial habilitado (clientes
            que ya contrataron el servicio), para procesar la conversación.
          </li>
        </ul>
        <p>
          Estos proveedores pueden almacenar o procesar los datos en servidores ubicados fuera de Chile. Solo
          reciben lo necesario para prestar su servicio y no los usan para fines propios.
        </p>
        <p>
          Mercado Pago es un enlace de pago externo: cuando pagas, tus datos de pago los recibe Mercado Pago
          directamente en su propio sitio. WebBot no le envía ningún dato tuyo y no tiene acceso a tu información de
          pago.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="6. Cookies">
        <p>Usamos únicamente cookies funcionales, necesarias para que el servicio funcione:</p>
        <ul>
          <li>
            <code>webbot_session</code>: identifica tu sesión de demo. Dura 1 año.
          </li>
          <li>
            <code>webbot_auth</code>: mantiene tu sesión iniciada si tienes una cuenta. Dura 30 días y es{' '}
            <code>httpOnly</code> (no accesible desde scripts del navegador).
          </li>
          <li>
            <code>webbot_admin</code>: sesión del panel administrativo. Dura 12 horas.
          </li>
        </ul>
        <p>No usamos cookies de analítica ni de publicidad, ni almacenamiento local (localStorage) con ese fin.</p>
      </LegalSeccion>

      <LegalSeccion titulo="7. Conservación de los datos">
        <p>
          Conservamos tus datos mientras dure tu relación con nosotros (como lead o como cliente), o hasta que nos
          solicites su eliminación. Tu dirección IP no queda almacenada: se usa solo en memoria, por hasta 24 horas,
          para limitar el abuso del servicio, y nunca se guarda en la base de datos.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="8. Tus derechos y cómo ejercerlos">
        <p>
          Conforme a la Ley 19.628 sobre Protección de la Vida Privada, tienes derecho a acceder, rectificar,
          cancelar (eliminar) y oponerte al tratamiento de tus datos personales. Para ejercer cualquiera de estos
          derechos, escríbenos a <a href="mailto:team@devalpo.cl">team@devalpo.cl</a>: respondemos manualmente cada
          solicitud, hoy no existe un flujo automático de autoservicio.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="9. Seguridad">
        <p>
          Aplicamos medidas de seguridad razonables para proteger tus datos (por ejemplo, cookies de sesión
          protegidas y acceso restringido a la base de datos). Ningún sistema es 100% infalible, por lo que no
          podemos garantizar una seguridad absoluta.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="10. Menores de edad">
        <p>
          WebBot no está dirigido a menores de edad. Si tomamos conocimiento de que recibimos datos de un menor sin
          el consentimiento correspondiente, los eliminaremos.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="11. Cambios a esta política">
        <p>
          Podemos actualizar esta política. Si hacemos cambios relevantes, lo indicaremos en esta misma página.
          Última actualización: 26 de septiembre de 2026.
        </p>
      </LegalSeccion>
    </LegalLayout>
  )
}
