import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { obtenerMomento2UC } from '@/infrastructure/container'
import { COOKIE_NAME } from '../sessionCookie'
import { urlSitioDemo } from '../urlSitioDemo'
import { EstadoMomento2 } from './EstadosMomento2'
import { Momento2 } from './Momento2'

export const metadata: Metadata = {
  title: 'Completar tu sitio · WebBot',
  robots: { index: false },
}

// Momento 2 (S3): lee el sitio de demo por la cookie de la sesión del chat y
// decide qué mostrar: la tarea, el momento 2 cerrado (Devalpo ya confirmó el
// pago) o la sesión vencida. Nunca confía en un id de sitio del cliente.
export default async function CompletarPage() {
  const cookieStore = await cookies()
  const estado = await obtenerMomento2UC.execute(cookieStore.get(COOKIE_NAME)?.value)

  if (estado.estado !== 'abierto') return <EstadoMomento2 motivo={estado.estado} />

  return (
    <Momento2
      template={estado.template}
      urlSitio={urlSitioDemo(estado.subdominio)}
      vistaInicial={estado.vista}
      iniciales={estado.iniciales}
    />
  )
}
